import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import crypto from "crypto";

const uuid = () => crypto.randomUUID();

type SizeValue = {
  width?: string;
  height?: string;
};

type ChoiceWithSizeValue = {
  optionId?: string;
  text?: string;
  size?: SizeValue;
};

type AnswerValue =
  | string
  | string[]
  | ChoiceWithSizeValue
  | ChoiceWithSizeValue[];

type SubmitAnswer = {
  questionId: string;
  value: AnswerValue;
};

type SubmitRequestBody = {
  formId?: string;
  formTitle?: string;
  responseId?: string;
  respondentId?: string;
  respondentName?: string;
  respondentEmail?: string;
  source?: string;
  mode?: "create" | "edit";
  answers?: SubmitAnswer[];
};

type SheetRowObject = Record<string, string>;

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TABS = {
  questions: "questions",
  options: "options",
  responses: "responses",
  responseItems: "response_items"
} as const;

const HEADERS = {
  responses: [
    "id",
    "form_id",
    "form_title",
    "submitted_at",
    "respondent_id",
    "respondent_name",
    "respondent_email",
    "status",
    "source"
  ],
  responseItems: [
    "id",
    "response_id",
    "form_id",
    "section_id",
    "question_id",
    "question_label",
    "question_type",
    "option_id",
    "option_label",
    "answer_text",
    "answer_date",
    "answer_boolean",
    "sort_order"
  ],
  questions: [
    "id",
    "form_id",
    "section_id",
    "type",
    "label",
    "required",
    "jump_enabled",
    "sort_order"
  ],
  options: [
    "id",
    "form_id",
    "section_id",
    "question_id",
    "label",
    "is_other",
    "go_to_kind",
    "go_to_section_id",
    "sort_order"
  ]
} as const;

function assertEnv() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!SERVICE_ACCOUNT_EMAIL) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  }
  if (!PRIVATE_KEY) throw new Error("Missing GOOGLE_PRIVATE_KEY");
}

function rowToObject(
  headers: readonly string[],
  row: unknown[]
): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((header, index) => {
    obj[header] = String(row[index] ?? "");
  });
  return obj;
}

function objectToRow(
  headers: readonly string[],
  row: Record<string, string>
): string[] {
  return headers.map((header) => row[header] ?? "");
}

async function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  await auth.authorize();

  return google.sheets({ version: "v4", auth });
}

async function readTab(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string
): Promise<string[][]> {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A:Z`
  });

  return (resp.data.values ?? []) as string[][];
}

async function ensureHeaderIfEmpty(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string,
  expectedHeaders: readonly string[],
  existingRows?: string[][]
) {
  const rows = existingRows ?? (await readTab(sheets, tabName));

  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [Array.from(expectedHeaders)]
      }
    });

    return [Array.from(expectedHeaders)];
  }

  return rows;
}

async function appendRows(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string,
  rows: string[][]
) {
  if (!rows.length) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows
    }
  });
}

async function replaceTabRows(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string,
  rows: string[][]
) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A:Z`
  });

  if (!rows.length) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows
    }
  });
}

function normalizeBody(body: SubmitRequestBody) {
  return {
    formId: body.formId?.trim() ?? "",
    formTitle: body.formTitle?.trim() ?? "",
    responseId: body.responseId?.trim() ?? "",
    respondentId: body.respondentId?.trim() ?? "",
    respondentName: body.respondentName?.trim() ?? "",
    respondentEmail: body.respondentEmail?.trim() ?? "",
    source: body.source?.trim() ?? "web",
    mode: body.mode === "edit" ? "edit" : "create",
    answers: Array.isArray(body.answers) ? body.answers : []
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChoiceWithSizeValue(value: unknown): value is ChoiceWithSizeValue {
  return isObject(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatSize(size?: SizeValue): string {
  if (!size) return "";

  const width = normalizeString(size.width);
  const height = normalizeString(size.height);

  if (width && height) return `${width}x${height}`;
  if (width) return width;
  if (height) return height;

  return "";
}

function buildChoiceAnswerText(params: {
  optionLabel?: string;
  extraText?: string;
  size?: SizeValue;
}) {
  const parts: string[] = [];

  const optionLabel = normalizeString(params.optionLabel);
  const extraText = normalizeString(params.extraText);
  const sizeText = formatSize(params.size);

  if (optionLabel) parts.push(optionLabel);
  if (extraText) parts.push(extraText);
  if (sizeText) parts.push(`Tamanho: ${sizeText}`);

  return parts.join(" | ");
}

function extractMultipleChoiceValue(value: AnswerValue): {
  optionId: string;
  answerText: string;
} {
  if (typeof value === "string") {
    return {
      optionId: value,
      answerText: ""
    };
  }

  if (isChoiceWithSizeValue(value)) {
    return {
      optionId: normalizeString(value.optionId),
      answerText: buildChoiceAnswerText({
        extraText: value.text,
        size: value.size
      })
    };
  }

  return {
    optionId: "",
    answerText: ""
  };
}

function extractCheckboxValues(value: AnswerValue): Array<{
  optionId: string;
  answerText: string;
}> {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") {
        return {
          optionId: item,
          answerText: ""
        };
      }

      if (isChoiceWithSizeValue(item)) {
        return {
          optionId: normalizeString(item.optionId),
          answerText: buildChoiceAnswerText({
            extraText: item.text,
            size: item.size
          })
        };
      }

      return {
        optionId: "",
        answerText: ""
      };
    });
  }

  return [];
}

function stringifyFallbackValue(value: AnswerValue): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (isObject(value)) return JSON.stringify(value);
  return "";
}

function buildResponseItemRows(params: {
  formId: string;
  responseId: string;
  answers: SubmitAnswer[];
  questionsById: Map<string, SheetRowObject>;
  optionsByQuestionId: Map<string, SheetRowObject[]>;
}) {
  const { formId, responseId, answers, questionsById, optionsByQuestionId } =
    params;

  const responseItemRows: string[][] = [];

  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question) continue;

    const questionType = question.type;
    const questionOptions = optionsByQuestionId.get(question.id) ?? [];
    const sortOrder = String(question.sort_order ?? "");

    if (questionType === "checkbox") {
      const selectedValues = extractCheckboxValues(answer.value);

      for (const selected of selectedValues) {
        const selectedOption = questionOptions.find(
          (opt) => opt.id === selected.optionId
        );

        const answerText =
          selected.answerText ||
          buildChoiceAnswerText({
            optionLabel: selectedOption?.label
          });

        responseItemRows.push([
          uuid(),
          responseId,
          formId,
          question.section_id ?? "",
          question.id,
          question.label ?? "",
          questionType,
          selectedOption?.id ?? selected.optionId ?? "",
          selectedOption?.label ?? "",
          answerText,
          "",
          "",
          sortOrder
        ]);
      }

      continue;
    }

    if (questionType === "multipleChoice") {
      const selected = extractMultipleChoiceValue(answer.value);
      const selectedOption = questionOptions.find(
        (opt) => opt.id === selected.optionId
      );

      const answerText =
        selected.answerText ||
        buildChoiceAnswerText({
          optionLabel: selectedOption?.label
        });

      responseItemRows.push([
        uuid(),
        responseId,
        formId,
        question.section_id ?? "",
        question.id,
        question.label ?? "",
        questionType,
        selectedOption?.id ?? selected.optionId ?? "",
        selectedOption?.label ?? "",
        answerText,
        "",
        "",
        sortOrder
      ]);

      continue;
    }

    if (questionType === "date") {
      const dateValue = typeof answer.value === "string" ? answer.value : "";

      responseItemRows.push([
        uuid(),
        responseId,
        formId,
        question.section_id ?? "",
        question.id,
        question.label ?? "",
        questionType,
        "",
        "",
        "",
        dateValue,
        "",
        sortOrder
      ]);

      continue;
    }

    if (questionType === "boolean") {
      const booleanValue = typeof answer.value === "string" ? answer.value : "";

      responseItemRows.push([
        uuid(),
        responseId,
        formId,
        question.section_id ?? "",
        question.id,
        question.label ?? "",
        questionType,
        "",
        "",
        "",
        "",
        booleanValue,
        sortOrder
      ]);

      continue;
    }

    const textValue = stringifyFallbackValue(answer.value);

    responseItemRows.push([
      uuid(),
      responseId,
      formId,
      question.section_id ?? "",
      question.id,
      question.label ?? "",
      questionType,
      "",
      "",
      textValue,
      "",
      "",
      sortOrder
    ]);
  }

  return responseItemRows;
}

function findResponseRowIndex(
  responseRows: SheetRowObject[],
  responseId: string,
  formId: string
) {
  return responseRows.findIndex(
    (row) => row.id === responseId && row.form_id === formId
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = normalizeBody(req.body as SubmitRequestBody);

    if (!body.formId || !Array.isArray(body.answers)) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    const isEdit =
      req.method === "PUT" || body.mode === "edit" || Boolean(body.responseId);

    if (isEdit && !body.responseId) {
      return res.status(400).json({
        ok: false,
        error: "responseId é obrigatório para editar uma resposta."
      });
    }

    assertEnv();
    const sheets = await getSheetsClient();

    const [questionsRaw, optionsRaw, responsesRaw, responseItemsRaw] =
      await Promise.all([
        readTab(sheets, TABS.questions),
        readTab(sheets, TABS.options),
        readTab(sheets, TABS.responses),
        readTab(sheets, TABS.responseItems)
      ]);

    const ensuredResponsesRaw = await ensureHeaderIfEmpty(
      sheets,
      TABS.responses,
      HEADERS.responses,
      responsesRaw
    );

    const ensuredResponseItemsRaw = await ensureHeaderIfEmpty(
      sheets,
      TABS.responseItems,
      HEADERS.responseItems,
      responseItemsRaw
    );

    const questionRows = questionsRaw.slice(1).map((row) =>
      rowToObject(HEADERS.questions, row)
    );

    const optionRows = optionsRaw.slice(1).map((row) =>
      rowToObject(HEADERS.options, row)
    );

    const responseRows = ensuredResponsesRaw.slice(1).map((row) =>
      rowToObject(HEADERS.responses, row)
    );

    const responseItemRows = ensuredResponseItemsRaw.slice(1).map((row) =>
      rowToObject(HEADERS.responseItems, row)
    );

    const formQuestions = questionRows.filter((q) => q.form_id === body.formId);

    const questionsById = new Map(formQuestions.map((q) => [q.id, q]));
    const optionsByQuestionId = new Map<string, SheetRowObject[]>();

    for (const opt of optionRows) {
      if (!optionsByQuestionId.has(opt.question_id)) {
        optionsByQuestionId.set(opt.question_id, []);
      }
      optionsByQuestionId.get(opt.question_id)!.push(opt);
    }

    if (!isEdit) {
      const responseId = uuid();
      const submittedAt = new Date().toISOString();

      const responseRow = [
        responseId,
        body.formId,
        body.formTitle,
        submittedAt,
        body.respondentId,
        body.respondentName,
        body.respondentEmail,
        "submitted",
        body.source
      ];

      const newResponseItemRows = buildResponseItemRows({
        formId: body.formId,
        responseId,
        answers: body.answers,
        questionsById,
        optionsByQuestionId
      });

      await Promise.all([
        appendRows(sheets, TABS.responses, [responseRow]),
        appendRows(sheets, TABS.responseItems, newResponseItemRows)
      ]);

      return res.status(200).json({
        ok: true,
        mode: "create",
        formId: body.formId,
        responseId
      });
    }

    const existingIndex = findResponseRowIndex(
      responseRows,
      body.responseId,
      body.formId
    );

    if (existingIndex < 0) {
      return res.status(404).json({
        ok: false,
        error: "Resposta não encontrada para edição."
      });
    }

    const existingResponse = responseRows[existingIndex];
    const updatedSubmittedAt = new Date().toISOString();

    const updatedResponseRow: SheetRowObject = {
      ...existingResponse,
      id: body.responseId,
      form_id: body.formId,
      form_title: body.formTitle || existingResponse.form_title || "",
      submitted_at: updatedSubmittedAt,
      respondent_id: body.respondentId || existingResponse.respondent_id || "",
      respondent_name:
        body.respondentName || existingResponse.respondent_name || "",
      respondent_email:
        body.respondentEmail || existingResponse.respondent_email || "",
      status: "submitted",
      source: body.source || existingResponse.source || "web"
    };

    const nextResponsesObjects = [...responseRows];
    nextResponsesObjects[existingIndex] = updatedResponseRow;

    const filteredResponseItems = responseItemRows.filter(
      (item) => item.response_id !== body.responseId
    );

    const rebuiltResponseItemRows = buildResponseItemRows({
      formId: body.formId,
      responseId: body.responseId,
      answers: body.answers,
      questionsById,
      optionsByQuestionId
    });

    const finalResponsesSheet = [
      Array.from(HEADERS.responses),
      ...nextResponsesObjects.map((row) => objectToRow(HEADERS.responses, row))
    ];

    const finalResponseItemsSheet = [
      Array.from(HEADERS.responseItems),
      ...filteredResponseItems.map((row) =>
        objectToRow(HEADERS.responseItems, row)
      ),
      ...rebuiltResponseItemRows
    ];

    await Promise.all([
      replaceTabRows(sheets, TABS.responses, finalResponsesSheet),
      replaceTabRows(sheets, TABS.responseItems, finalResponseItemsSheet)
    ]);

    return res.status(200).json({
      ok: true,
      mode: "edit",
      formId: body.formId,
      responseId: body.responseId
    });
  } catch (e: any) {
    console.error("submit.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
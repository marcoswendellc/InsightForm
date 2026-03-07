import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import crypto from "crypto";

const uuid = () => crypto.randomUUID();

type AnswerValue = string | string[];

type SubmitAnswer = {
  questionId: string;
  value: AnswerValue;
};

type SubmitRequestBody = {
  formId?: string;
  formTitle?: string;
  respondentId?: string;
  respondentName?: string;
  respondentEmail?: string;
  source?: string;
  answers?: SubmitAnswer[];
};

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

async function getSheetsClient() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!SERVICE_ACCOUNT_EMAIL) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!PRIVATE_KEY) throw new Error("Missing GOOGLE_PRIVATE_KEY");

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = req.body as SubmitRequestBody;

    if (!body?.formId || !Array.isArray(body.answers)) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    const sheets = await getSheetsClient();

    const [questionsRaw, optionsRaw, responsesRaw, responseItemsRaw] =
      await Promise.all([
        readTab(sheets, TABS.questions),
        readTab(sheets, TABS.options),
        readTab(sheets, TABS.responses),
        readTab(sheets, TABS.responseItems)
      ]);

    await Promise.all([
      ensureHeaderIfEmpty(sheets, TABS.responses, HEADERS.responses, responsesRaw),
      ensureHeaderIfEmpty(
        sheets,
        TABS.responseItems,
        HEADERS.responseItems,
        responseItemsRaw
      )
    ]);

    const questionRows = questionsRaw.slice(1).map((row) =>
      rowToObject(HEADERS.questions, row)
    );

    const optionRows = optionsRaw.slice(1).map((row) =>
      rowToObject(HEADERS.options, row)
    );

    const formQuestions = questionRows.filter((q) => q.form_id === body.formId);

    const questionsById = new Map(formQuestions.map((q) => [q.id, q]));
    const optionsByQuestionId = new Map<string, Record<string, string>[]>();

    for (const opt of optionRows) {
      if (!optionsByQuestionId.has(opt.question_id)) {
        optionsByQuestionId.set(opt.question_id, []);
      }
      optionsByQuestionId.get(opt.question_id)!.push(opt);
    }

    const responseId = uuid();
    const submittedAt = new Date().toISOString();

    const responseRow = [
      responseId,
      body.formId,
      body.formTitle ?? "",
      submittedAt,
      body.respondentId ?? "",
      body.respondentName ?? "",
      body.respondentEmail ?? "",
      "submitted",
      body.source ?? "web"
    ];

    const responseItemRows: string[][] = [];

    for (const answer of body.answers) {
      const question = questionsById.get(answer.questionId);
      if (!question) continue;

      const questionType = question.type;
      const questionOptions = optionsByQuestionId.get(question.id) ?? [];
      const sortOrder = String(question.sort_order ?? "");

      if (questionType === "checkbox") {
        const selectedIds = Array.isArray(answer.value) ? answer.value : [];

        for (const selectedId of selectedIds) {
          const selectedOption = questionOptions.find((opt) => opt.id === selectedId);

          responseItemRows.push([
            uuid(),
            responseId,
            body.formId,
            question.section_id ?? "",
            question.id,
            question.label ?? "",
            questionType,
            selectedOption?.id ?? "",
            selectedOption?.label ?? "",
            "",
            "",
            "",
            sortOrder
          ]);
        }

        continue;
      }

      if (questionType === "multipleChoice") {
        const selectedId = typeof answer.value === "string" ? answer.value : "";
        const selectedOption = questionOptions.find((opt) => opt.id === selectedId);

        responseItemRows.push([
          uuid(),
          responseId,
          body.formId,
          question.section_id ?? "",
          question.id,
          question.label ?? "",
          questionType,
          selectedOption?.id ?? "",
          selectedOption?.label ?? "",
          "",
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
          body.formId,
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

      const textValue = typeof answer.value === "string" ? answer.value : "";

      responseItemRows.push([
        uuid(),
        responseId,
        body.formId,
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

    await Promise.all([
      appendRows(sheets, TABS.responses, [responseRow]),
      appendRows(sheets, TABS.responseItems, responseItemRows)
    ]);

    return res.status(200).json({
      ok: true,
      responseId
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
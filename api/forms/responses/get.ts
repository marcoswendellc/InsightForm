import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getUserFromRequest } from "../../../src/server/_auth.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TABS = {
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
  ]
} as const;

type SizeValue = {
  width?: string;
  height?: string;
  unit?: string;
};

type ChoiceWithSizeValue = {
  optionId?: string;
  text?: string;
  size?: SizeValue;
};

type AnswersMap = Record<
  string,
  string | string[] | ChoiceWithSizeValue | ChoiceWithSizeValue[]
>;

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

function parseNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractTextWithoutSize(text: string): string {
  const normalized = normalizeString(text);
  if (!normalized) return "";

  const cleaned = normalized
    .replace(/\s*\|\s*Tamanho:\s*[\d.,]+\s*x\s*[\d.,]+\s*$/i, "")
    .replace(/^Tamanho:\s*[\d.,]+\s*x\s*[\d.,]+\s*$/i, "")
    .trim();

  return cleaned;
}

function parseSizeFromText(text: string): SizeValue | undefined {
  const normalized = normalizeString(text);
  if (!normalized) return undefined;

  // pega: 1,20 x 0,80 cm
  const match = normalized.match(
    /Tamanho:\s*([\d.,]+)\s*x\s*([\d.,]+)\s*(cm|m|mm)?/i
  );

  if (match) {
    return {
      width: match[1],
      height: match[2],
      unit: match[3] || ""
    };
  }

  // fallback simples
  const directMatch = normalized.match(
    /^([\d.,]+)\s*x\s*([\d.,]+)\s*(cm|m|mm)?$/i
  );

  if (directMatch) {
    return {
      width: directMatch[1],
      height: directMatch[2],
      unit: directMatch[3] || ""
    };
  }

  return undefined;
}

function buildAnswersMap(items: Record<string, string>[]): AnswersMap {
  const sortedItems = [...items].sort(
    (a, b) => parseNumber(a.sort_order) - parseNumber(b.sort_order)
  );

  const answers: AnswersMap = {};

  for (const item of sortedItems) {
    const questionId = item.question_id;
    const questionType = item.question_type;

    if (!questionId) continue;

    const parsedSize = parseSizeFromText(item.answer_text);
    const cleanedText = extractTextWithoutSize(item.answer_text);
    const optionLabel = normalizeString(item.option_label);
    const textWithoutOptionLabel =
      cleanedText && optionLabel && cleanedText === optionLabel
        ? ""
        : cleanedText.startsWith(`${optionLabel} | `)
          ? cleanedText.slice(`${optionLabel} | `.length).trim()
          : cleanedText;

    if (questionType === "checkbox") {
      const currentValue = answers[questionId];
      const currentStringIds = Array.isArray(currentValue)
        ? (currentValue as (string | ChoiceWithSizeValue)[]).filter(
            (item): item is string => typeof item === "string"
          )
        : [];
      const currentObjects = Array.isArray(currentValue)
        ? (currentValue as (string | ChoiceWithSizeValue)[])
            .filter((item): item is ChoiceWithSizeValue =>
              typeof item !== "string"
            )
            .map((item) => ({
              optionId: normalizeString(item.optionId),
              text: normalizeString(item.text),
              size: item.size
                ? {
                    width: normalizeString(item.size.width),
                    height: normalizeString(item.size.height),
                    unit: normalizeString(item.size.unit)
                  }
                : undefined
            }))
        : [];

      const checkboxItem: ChoiceWithSizeValue = {
        optionId: item.option_id || ""
      };

      if (parsedSize) {
        checkboxItem.size = parsedSize;
      }

      if (textWithoutOptionLabel) {
        checkboxItem.text = textWithoutOptionLabel;
      }

      const hasAdditionalData = !!parsedSize || !!textWithoutOptionLabel;

      if (hasAdditionalData) {
        const normalizedPreviousObjects = [
          ...currentObjects,
          ...currentStringIds.map((id) => ({
            optionId: id,
            size: { width: "", height: "", unit: "" }
          }))
        ];

        answers[questionId] = [...normalizedPreviousObjects, checkboxItem];
      } else if (currentObjects.length > 0) {
        answers[questionId] = [
          ...currentObjects,
          { optionId: item.option_id || "", size: { width: "", height: "", unit: "" } }
        ];
      } else {
        answers[questionId] = [...currentStringIds, item.option_id || ""].filter(
          Boolean
        );
      }

      continue;
    }

    if (questionType === "multipleChoice") {
      const multipleChoiceValue: ChoiceWithSizeValue = {
        optionId: item.option_id || ""
      };

      if (parsedSize) {
        multipleChoiceValue.size = parsedSize;
      }

      if (textWithoutOptionLabel) {
        multipleChoiceValue.text = textWithoutOptionLabel;
      }

      const hasAdditionalData = !!parsedSize || !!textWithoutOptionLabel;
      answers[questionId] = hasAdditionalData
        ? multipleChoiceValue
        : item.option_id || "";
      continue;
    }

    if (questionType === "date") {
      answers[questionId] = item.answer_date || "";
      continue;
    }

    if (questionType === "boolean") {
      answers[questionId] = item.answer_boolean || "";
      continue;
    }

    answers[questionId] = item.answer_text || "";
  }

  return answers;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const formId =
      String(req.query.formId ?? "").trim() ||
      String(req.query.id ?? "").trim();

    const responseId = String(req.query.responseId ?? "").trim();

    if (!formId) {
      return res.status(400).json({
        ok: false,
        error: "formId é obrigatório."
      });
    }

    if (!responseId) {
      return res.status(400).json({
        ok: false,
        error: "responseId é obrigatório."
      });
    }

    assertEnv();
    const sheets = await getSheetsClient();

    const [responsesRaw, responseItemsRaw] = await Promise.all([
      readTab(sheets, TABS.responses),
      readTab(sheets, TABS.responseItems)
    ]);

    const responses = responsesRaw
      .slice(1)
      .map((row) => rowToObject(HEADERS.responses, row));

    const responseItems = responseItemsRaw
      .slice(1)
      .map((row) => rowToObject(HEADERS.responseItems, row));

    const response = responses.find(
      (row) => row.id === responseId && row.form_id === formId
    );

    if (!response) {
      return res.status(404).json({
        ok: false,
        error: "Resposta não encontrada."
      });
    }

    const isOwner =
      response.respondent_id === user.id ||
      (!!user.username &&
        !!response.respondent_email &&
        response.respondent_email.toLowerCase() === user.username.toLowerCase());

    if (user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        ok: false,
        error: "Sem permissão para acessar esta resposta."
      });
    }

    const items = responseItems.filter(
      (item) => item.response_id === responseId && item.form_id === formId
    );

    const answers = buildAnswersMap(items);

    return res.status(200).json({
      ok: true,
      response: {
        id: response.id,
        form_id: response.form_id,
        form_title: response.form_title,
        submitted_at: response.submitted_at,
        respondent_id: response.respondent_id,
        respondent_name: response.respondent_name,
        respondent_email: response.respondent_email,
        answers
      }
    });
  } catch (e: unknown) {
    console.error("responses/get.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "error"
    });
  }
}
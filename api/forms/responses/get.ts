import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getUserFromRequest } from "../../_auth.js";

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

type AnswersMap = Record<string, string | string[]>;

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

function buildAnswersMap(items: Record<string, string>[]): AnswersMap {
  const sortedItems = [...items].sort(
    (a, b) => parseNumber(a.sort_order) - parseNumber(b.sort_order)
  );

  const answers: AnswersMap = {};

  for (const item of sortedItems) {
    const questionId = item.question_id;
    const questionType = item.question_type;

    if (!questionId) continue;

    if (questionType === "checkbox") {
      const currentValue = answers[questionId];
      const currentList = Array.isArray(currentValue) ? currentValue : [];

      if (item.option_id) {
        answers[questionId] = [...currentList, item.option_id];
      } else if (!answers[questionId]) {
        answers[questionId] = [];
      }

      continue;
    }

    if (questionType === "multipleChoice") {
      answers[questionId] = item.option_id || "";
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
  } catch (e: any) {
    console.error("responses/get.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
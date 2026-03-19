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

function assertEnv() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!SERVICE_ACCOUNT_EMAIL) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!PRIVATE_KEY) throw new Error("Missing GOOGLE_PRIVATE_KEY");
}

function rowToObject(headers: readonly string[], row: unknown[]) {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => (obj[h] = String(row[i] ?? "")));
  return obj;
}

function objectToRow(headers: readonly string[], row: Record<string, string>) {
  return headers.map((h) => row[h] ?? "");
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

async function readTab(sheets: any, tab: string) {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${tab}!A:Z`
  });

  return (resp.data.values ?? []) as string[][];
}

async function replaceTab(sheets: any, tab: string, rows: string[][]) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID!,
    range: `${tab}!A:Z`
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows }
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ ok: false });
  }

  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ ok: false });

    const { formId, responseId } = req.query;

    if (!formId || !responseId) {
      return res.status(400).json({ ok: false, error: "Missing params" });
    }

    assertEnv();
    const sheets = await getSheetsClient();

    const [responsesRaw, itemsRaw] = await Promise.all([
      readTab(sheets, TABS.responses),
      readTab(sheets, TABS.responseItems)
    ]);

    const responses = responsesRaw.slice(1).map(r =>
      rowToObject(HEADERS.responses, r)
    );

    const target = responses.find(
      r => r.id === responseId && r.form_id === formId
    );

    if (!target) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    // 🔐 permissão
    const isOwner =
      target.respondent_id === user.id ||
      target.respondent_email?.toLowerCase() === user.username?.toLowerCase();

    if (user.role !== "admin" && !isOwner) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    // remove resposta
    const newResponses = responses.filter(
      r => !(r.id === responseId && r.form_id === formId)
    );

    // remove itens
    const items = itemsRaw.slice(1).map(r =>
      rowToObject(HEADERS.responseItems, r)
    );

    const newItems = items.filter(
      i => i.response_id !== responseId
    );

    await Promise.all([
      replaceTab(sheets, TABS.responses, [
        HEADERS.responses as unknown as string[],
        ...newResponses.map(r => objectToRow(HEADERS.responses, r))
      ]),
      replaceTab(sheets, TABS.responseItems, [
        HEADERS.responseItems as unknown as string[],
        ...newItems.map(r => objectToRow(HEADERS.responseItems, r))
      ])
    ]);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
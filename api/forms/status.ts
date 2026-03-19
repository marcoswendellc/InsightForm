import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getUserFromRequest } from "../../src/server/_auth.js";

type SheetRowObject = Record<string, string>;
type StatusValue = "draft" | "published";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TABS = {
  forms: "forms"
} as const;

const HEADERS = {
  forms: ["id", "title", "status", "created_at", "updated_at", "published_at"]
} as const;

function assertEnv() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!SERVICE_ACCOUNT_EMAIL) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  }
  if (!PRIVATE_KEY) throw new Error("Missing GOOGLE_PRIVATE_KEY");
}

function normalizeString(value?: string) {
  return value?.trim() ?? "";
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
  row: SheetRowObject
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

async function rewriteTab(
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const formId = normalizeString(req.body?.id);
    const status = normalizeString(req.body?.status).toLowerCase() as StatusValue;

    if (!formId) {
      return res.status(400).json({ ok: false, error: "Missing form id" });
    }

    if (status !== "draft" && status !== "published") {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    assertEnv();
    const sheets = await getSheetsClient();
    const formsRaw = await readTab(sheets, TABS.forms);

    if (!formsRaw.length) {
      return res.status(404).json({ ok: false, error: "Forms tab is empty" });
    }

    const headerRow = formsRaw[0];
    const formRows = formsRaw.slice(1).map((row) => rowToObject(HEADERS.forms, row));

    const targetIndex = formRows.findIndex((row) => row.id === formId);

    if (targetIndex === -1) {
      return res.status(404).json({ ok: false, error: "Form not found" });
    }

    const now = new Date().toISOString();
    const current = formRows[targetIndex];

    const updatedRow: SheetRowObject = {
      ...current,
      status,
      updated_at: now,
      published_at: status === "published" ? current.published_at || now : ""
    };

    formRows[targetIndex] = updatedRow;

    const nextRows: string[][] = [
      headerRow,
      ...formRows.map((row) => objectToRow(HEADERS.forms, row))
    ];

    await rewriteTab(sheets, TABS.forms, nextRows);

    return res.status(200).json({
      ok: true,
      id: formId,
      status,
      published_at: updatedRow.published_at
    });
  } catch (e: any) {
    console.error("status.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
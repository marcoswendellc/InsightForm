import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TAB_NAME = "forms";

const HEADERS = [
  "id",
  "title",
  "status",
  "created_at",
  "updated_at",
  "published_at"
] as const;

type FormRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string;
};

function assertEnv() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!SERVICE_ACCOUNT_EMAIL) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
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

function sortByUpdatedAtDesc(forms: FormRow[]) {
  return [...forms].sort((a, b) => {
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bTime - aTime;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    assertEnv();
    const sheets = await getSheetsClient();

    const formsRaw = await readTab(sheets, TAB_NAME);
    const formsRows = await ensureHeaderIfEmpty(sheets, TAB_NAME, HEADERS, formsRaw);

    const forms = formsRows
      .slice(1)
      .map((row) => rowToObject(HEADERS, row))
      .filter((row) => row.id)
      .map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        published_at: row.published_at
      }));

    return res.status(200).json({
      ok: true,
      forms: sortByUpdatedAtDesc(forms)
    });
  } catch (e: any) {
    console.error("list.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
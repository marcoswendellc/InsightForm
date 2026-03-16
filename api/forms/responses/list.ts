import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getUserFromRequest } from "../../_auth.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TAB_NAME = "responses";

const HEADERS = [
  "id",
  "form_id",
  "form_title",
  "submitted_at",
  "respondent_id",
  "respondent_name",
  "respondent_email",
  "status",
  "source"
] as const;

type ResponseRow = {
  id: string;
  form_id: string;
  form_title: string;
  submitted_at: string;
  respondent_id: string;
  respondent_name: string;
  respondent_email: string;
  status: string;
  source: string;
};

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

function sortBySubmittedAtDesc(rows: ResponseRow[]) {
  return [...rows].sort((a, b) => {
    const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;

    return bTime - aTime;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const formId = String(req.query.formId ?? "").trim();

    if (!formId) {
      return res.status(400).json({
        ok: false,
        error: "formId é obrigatório."
      });
    }

    assertEnv();

    const sheets = await getSheetsClient();
    const rows = await readTab(sheets, TAB_NAME);

    if (rows.length === 0) {
      return res.status(200).json({ ok: true, responses: [] });
    }

    let responses: ResponseRow[] = rows
      .slice(1)
      .map((row) => rowToObject(HEADERS, row))
      .filter((row) => row.id && row.form_id === formId)
      .map((row) => ({
        id: row.id,
        form_id: row.form_id,
        form_title: row.form_title,
        submitted_at: row.submitted_at,
        respondent_id: row.respondent_id,
        respondent_name: row.respondent_name,
        respondent_email: row.respondent_email,
        status: row.status,
        source: row.source
      }));

    if (user.role !== "admin") {
      responses = responses.filter(
        (response) =>
          response.respondent_id === user.id ||
          (!!user.username &&
            !!response.respondent_email &&
            response.respondent_email.toLowerCase() ===
              user.username.toLowerCase())
      );
    }

    const sortedResponses = sortBySubmittedAtDesc(responses);

    return res.status(200).json({
      ok: true,
      responses: sortedResponses.map((response) => {
        const isOwner =
          response.respondent_id === user.id ||
          (!!user.username &&
            !!response.respondent_email &&
            response.respondent_email.toLowerCase() ===
              user.username.toLowerCase());

        const canEdit = user.role === "admin" || isOwner;
        const canPrint = user.role === "admin" || isOwner;

        return {
          id: response.id,
          user_name:
            response.respondent_name ||
            response.respondent_email ||
            "Usuário sem identificação",
          submitted_at: response.submitted_at,
          can_edit: canEdit,
          can_print: canPrint
        };
      })
    });
  } catch (e: any) {
    console.error("responses/list.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
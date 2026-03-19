import { google } from "googleapis";

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const creds = JSON.parse(raw);

  // No Vercel às vezes a private_key vem com \n escapado
  if (creds.private_key && typeof creds.private_key === "string") {
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }

  return creds;
}

export async function getSheetsClient() {
  const creds = getServiceAccount();

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  await auth.authorize();

  return google.sheets({ version: "v4", auth });
}

export async function readSheetRange(range: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

  const sheets = await getSheetsClient();

  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });

  return r.data.values ?? [];
}
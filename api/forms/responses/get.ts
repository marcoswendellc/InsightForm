import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../../_auth.js";
import { readSheetRange } from "../../_gsheets.js";

const TAB_NAME = "responses";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false });
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

    const rows = await readSheetRange(`${TAB_NAME}!A:Z`);
    const dataRows = rows.slice(1);

    const responseRow = dataRows.find(
      (row: any[]) =>
        String(row[0]) === responseId && String(row[1]) === formId
    );

    if (!responseRow) {
      return res.status(404).json({
        ok: false,
        error: "Resposta não encontrada."
      });
    }

    const response = {
      id: responseRow[0],
      form_id: responseRow[1],
      form_title: responseRow[2],
      submitted_at: responseRow[3],
      respondent_id: responseRow[4],
      respondent_name: responseRow[5],
      respondent_email: responseRow[6],
      status: responseRow[7],
      source: responseRow[8],
      answers: JSON.parse(responseRow[9] || "{}")
    };

    return res.status(200).json({
      ok: true,
      response
    });
  } catch (e: any) {
    console.error("responses/get.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getUserFromRequest, isPublishedStatus } from "../../src/server/_auth.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TABS = {
  forms: "forms",
  sections: "sections",
  questions: "questions",
  options: "options"
} as const;

const HEADERS = {
  forms: ["id", "title", "status", "created_at", "updated_at", "published_at"],
  sections: [
    "id",
    "form_id",
    "title",
    "description",
    "sort_order",
    "go_to_kind",
    "go_to_section_id"
  ],
  questions: [
    "id",
    "form_id",
    "section_id",
    "type",
    "label",
    "required",
    "jump_enabled",
    "include_time",
    "size_enabled",
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

type GoTo =
  | { kind: "next" }
  | { kind: "section"; sectionId: string }
  | { kind: "submit" };

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

function parseBool(value: string) {
  return String(value).toLowerCase() === "true";
}

function parseNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseGoTo(kind?: string, sectionId?: string): GoTo | undefined {
  if (!kind || kind === "next") return { kind: "next" };
  if (kind === "submit") return { kind: "submit" };
  if (kind === "section" && sectionId) {
    return { kind: "section", sectionId };
  }
  return { kind: "next" };
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const formId =
      String(req.query.id ?? "").trim() ||
      String(req.query.formId ?? "").trim();

    if (!formId) {
      return res.status(400).json({ ok: false, error: "Missing id" });
    }

    assertEnv();
    const sheets = await getSheetsClient();

    const [formsRaw, sectionsRaw, questionsRaw, optionsRaw] = await Promise.all([
      readTab(sheets, TABS.forms),
      readTab(sheets, TABS.sections),
      readTab(sheets, TABS.questions),
      readTab(sheets, TABS.options)
    ]);

    const formRows = formsRaw.slice(1).map((row) => rowToObject(HEADERS.forms, row));
    const sectionRows = sectionsRaw
      .slice(1)
      .map((row) => rowToObject(HEADERS.sections, row));
    const questionRows = questionsRaw
      .slice(1)
      .map((row) => rowToObject(HEADERS.questions, row));
    const optionRows = optionsRaw
      .slice(1)
      .map((row) => rowToObject(HEADERS.options, row));

    const formRow = formRows.find((row) => row.id === formId);

    if (!formRow) {
      return res.status(404).json({ ok: false, error: "Form not found" });
    }

    if (user.role !== "admin" && !isPublishedStatus(formRow.status)) {
      return res.status(403).json({ ok: false, error: "Form unavailable" });
    }

    const sections = sectionRows
      .filter((row) => row.form_id === formId)
      .sort((a, b) => parseNumber(a.sort_order) - parseNumber(b.sort_order))
      .map((sectionRow) => {
        const questions = questionRows
          .filter((row) => row.form_id === formId && row.section_id === sectionRow.id)
          .sort((a, b) => parseNumber(a.sort_order) - parseNumber(b.sort_order))
          .map((questionRow) => {
            const isOptionsType =
              questionRow.type === "multipleChoice" || questionRow.type === "checkbox";

            const options = isOptionsType
              ? optionRows
                  .filter(
                    (row) =>
                      row.form_id === formId &&
                      row.section_id === sectionRow.id &&
                      row.question_id === questionRow.id
                  )
                  .sort((a, b) => parseNumber(a.sort_order) - parseNumber(b.sort_order))
                  .map((optionRow) => ({
                    id: optionRow.id,
                    label: optionRow.label,
                    isOther: parseBool(optionRow.is_other),
                    goTo: parseGoTo(optionRow.go_to_kind, optionRow.go_to_section_id)
                  }))
              : undefined;

            return {
              id: questionRow.id,
              type: questionRow.type,
              label: questionRow.label,
              required: parseBool(questionRow.required),
              jumpEnabled:
                questionRow.type === "multipleChoice"
                  ? parseBool(questionRow.jump_enabled)
                  : undefined,
              includeTime:
                questionRow.type === "date"
                  ? parseBool(questionRow.include_time)
                  : false,
              sizeEnabled: parseBool(questionRow.size_enabled),
              options
            };
          });

        return {
          id: sectionRow.id,
          title: sectionRow.title,
          description: sectionRow.description,
          goTo: parseGoTo(sectionRow.go_to_kind, sectionRow.go_to_section_id),
          questions
        };
      });

    const form = {
      id: formRow.id,
      title: formRow.title,
      status: formRow.status,
      sections
    };

    return res.status(200).json({
      ok: true,
      form
    });
  } catch (e: any) {
    console.error("get.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
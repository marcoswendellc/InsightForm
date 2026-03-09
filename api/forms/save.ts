import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import crypto from "crypto";
import { getUserFromRequest } from "../_auth.js";

const uuid = () => crypto.randomUUID();

type GoTo =
  | { kind: "next" }
  | { kind: "section"; sectionId: string }
  | { kind: "submit" };

type OptionPayload = {
  id?: string;
  label?: string;
  isOther?: boolean;
  goTo?: GoTo;
};

type QuestionPayload = {
  id?: string;
  type: string;
  label?: string;
  required?: boolean;
  jumpEnabled?: boolean;
  options?: OptionPayload[];
};

type SectionPayload = {
  id?: string;
  title?: string;
  description?: string;
  goTo?: GoTo;
  questions: QuestionPayload[];
};

type FormPayload = {
  id?: string;
  title?: string;
  sections?: SectionPayload[];
};

type SaveRequestBody =
  | FormPayload
  | {
      id?: string;
      form?: FormPayload;
    };

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

function assertEnv() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!SERVICE_ACCOUNT_EMAIL) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!PRIVATE_KEY) throw new Error("Missing GOOGLE_PRIVATE_KEY");
}

function normalizeBody(body: SaveRequestBody): FormPayload {
  if (body && typeof body === "object" && "form" in body && body.form) {
    return {
      ...body.form,
      id: body.id ?? body.form.id
    };
  }

  return body as FormPayload;
}

function splitGoTo(goTo?: GoTo): { kind: string; sectionId: string } {
  if (!goTo) return { kind: "next", sectionId: "" };

  if (goTo.kind === "section") {
    return { kind: "section", sectionId: goTo.sectionId };
  }

  return { kind: goTo.kind, sectionId: "" };
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

async function rewriteTab(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string,
  rows: string[][]
) {
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

    const body = normalizeBody(req.body as SaveRequestBody);

    if (!body?.title || !Array.isArray(body.sections)) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    assertEnv();
    const sheets = await getSheetsClient();

    const [formsRaw, sectionsRaw, questionsRaw, optionsRaw] = await Promise.all([
      readTab(sheets, TABS.forms),
      readTab(sheets, TABS.sections),
      readTab(sheets, TABS.questions),
      readTab(sheets, TABS.options)
    ]);

    const formsRows = await ensureHeaderIfEmpty(
      sheets,
      TABS.forms,
      HEADERS.forms,
      formsRaw
    );
    const sectionsRows = await ensureHeaderIfEmpty(
      sheets,
      TABS.sections,
      HEADERS.sections,
      sectionsRaw
    );
    const questionsRows = await ensureHeaderIfEmpty(
      sheets,
      TABS.questions,
      HEADERS.questions,
      questionsRaw
    );
    const optionsRows = await ensureHeaderIfEmpty(
      sheets,
      TABS.options,
      HEADERS.options,
      optionsRaw
    );

    const existingFormObjects = formsRows.slice(1).map((row) =>
      rowToObject(HEADERS.forms, row)
    );
    const existingSectionObjects = sectionsRows.slice(1).map((row) =>
      rowToObject(HEADERS.sections, row)
    );
    const existingQuestionObjects = questionsRows.slice(1).map((row) =>
      rowToObject(HEADERS.questions, row)
    );
    const existingOptionObjects = optionsRows.slice(1).map((row) =>
      rowToObject(HEADERS.options, row)
    );

    const formId = body.id ?? uuid();
    const now = new Date().toISOString();

    const previousForm = existingFormObjects.find((row) => row.id === formId);
    const createdAt = previousForm?.created_at || now;
    const publishedAt = previousForm?.published_at || "";
    const status = previousForm?.status || "draft";

    const keptForms = existingFormObjects.filter((row) => row.id !== formId);
    const keptSections = existingSectionObjects.filter((row) => row.form_id !== formId);
    const keptQuestions = existingQuestionObjects.filter((row) => row.form_id !== formId);
    const keptOptions = existingOptionObjects.filter((row) => row.form_id !== formId);

    const newSectionRows: string[][] = [];
    const newQuestionRows: string[][] = [];
    const newOptionRows: string[][] = [];

    for (let si = 0; si < body.sections.length; si++) {
      const section = body.sections[si];
      const sectionId = section.id ?? uuid();
      const sectionGoTo = splitGoTo(section.goTo);

      newSectionRows.push([
        sectionId,
        formId,
        section.title ?? "",
        section.description ?? "",
        String(si),
        sectionGoTo.kind,
        sectionGoTo.sectionId
      ]);

      for (let qi = 0; qi < section.questions.length; qi++) {
        const question = section.questions[qi];
        const questionId = question.id ?? uuid();

        newQuestionRows.push([
          questionId,
          formId,
          sectionId,
          question.type ?? "",
          question.label ?? "",
          question.required ? "true" : "false",
          question.jumpEnabled ? "true" : "false",
          String(qi)
        ]);

        const needsOptions =
          question.type === "multipleChoice" || question.type === "checkbox";

        if (!needsOptions) continue;

        const options = question.options ?? [];

        for (let oi = 0; oi < options.length; oi++) {
          const option = options[oi];
          const optionId = option.id ?? uuid();
          const optionGoTo = splitGoTo(option.goTo);

          newOptionRows.push([
            optionId,
            formId,
            sectionId,
            questionId,
            option.label ?? "",
            option.isOther ? "true" : "false",
            optionGoTo.kind,
            optionGoTo.sectionId,
            String(oi)
          ]);
        }
      }
    }

    const nextFormRows: string[][] = [
      Array.from(HEADERS.forms),
      ...keptForms.map((row) => HEADERS.forms.map((h) => row[h] ?? "")),
      [formId, body.title ?? "", status, createdAt, now, publishedAt]
    ];

    const nextSectionRows: string[][] = [
      Array.from(HEADERS.sections),
      ...keptSections.map((row) => HEADERS.sections.map((h) => row[h] ?? "")),
      ...newSectionRows
    ];

    const nextQuestionRows: string[][] = [
      Array.from(HEADERS.questions),
      ...keptQuestions.map((row) => HEADERS.questions.map((h) => row[h] ?? "")),
      ...newQuestionRows
    ];

    const nextOptionRows: string[][] = [
      Array.from(HEADERS.options),
      ...keptOptions.map((row) => HEADERS.options.map((h) => row[h] ?? "")),
      ...newOptionRows
    ];

    await Promise.all([
      rewriteTab(sheets, TABS.forms, nextFormRows),
      rewriteTab(sheets, TABS.sections, nextSectionRows),
      rewriteTab(sheets, TABS.questions, nextQuestionRows),
      rewriteTab(sheets, TABS.options, nextOptionRows)
    ]);

    return res.status(200).json({ ok: true, id: formId });
  } catch (e: any) {
    console.error("save.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
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
  includeTime?: boolean;
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

type SheetRowObject = Record<string, string>;

type NormalizedOption = OptionPayload & {
  id: string;
};

type NormalizedQuestion = Omit<QuestionPayload, "options"> & {
  id: string;
  options: NormalizedOption[];
};

type NormalizedSection = Omit<SectionPayload, "questions"> & {
  id: string;
  questions: NormalizedQuestion[];
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
    "include_time",
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
  if (!SERVICE_ACCOUNT_EMAIL) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  }
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

function normalizeString(value?: string) {
  return value?.trim() ?? "";
}

function splitGoTo(goTo?: GoTo): { kind: string; sectionId: string } {
  if (!goTo) return { kind: "next", sectionId: "" };

  if (goTo.kind === "section") {
    return {
      kind: "section",
      sectionId: normalizeString(goTo.sectionId)
    };
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

function normalizeSections(sections: SectionPayload[]): NormalizedSection[] {
  return sections.map((section) => ({
    ...section,
    id: normalizeString(section.id) || uuid(),
    questions: (Array.isArray(section.questions) ? section.questions : []).map(
      (question) => ({
        ...question,
        id: normalizeString(question.id) || uuid(),
        options: (Array.isArray(question.options) ? question.options : []).map(
          (option) => ({
            ...option,
            id: normalizeString(option.id) || uuid()
          })
        )
      })
    )
  }));
}

function buildSectionRows(formId: string, sections: NormalizedSection[]) {
  const rows: string[][] = [];

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const goTo = splitGoTo(section.goTo);

    rows.push([
      section.id,
      formId,
      normalizeString(section.title),
      normalizeString(section.description),
      String(si),
      goTo.kind,
      goTo.sectionId
    ]);
  }

  return rows;
}

function buildQuestionRowsAndOptionRows(
  formId: string,
  sections: NormalizedSection[]
) {
  const questionRows: string[][] = [];
  const optionRows: string[][] = [];

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];

    for (let qi = 0; qi < section.questions.length; qi++) {
      const question = section.questions[qi];

      questionRows.push([
        question.id,
        formId,
        section.id,
        normalizeString(question.type),
        normalizeString(question.label),
        question.required ? "true" : "false",
        question.jumpEnabled ? "true" : "false",
        question.includeTime ? "true" : "false",
        String(qi)
      ]);

      const needsOptions =
        question.type === "multipleChoice" || question.type === "checkbox";

      if (!needsOptions) continue;

      for (let oi = 0; oi < question.options.length; oi++) {
        const option = question.options[oi];
        const optionGoTo = splitGoTo(option.goTo);

        optionRows.push([
          option.id,
          formId,
          section.id,
          question.id,
          normalizeString(option.label),
          option.isOther ? "true" : "false",
          optionGoTo.kind,
          optionGoTo.sectionId,
          String(oi)
        ]);
      }
    }
  }

  return { questionRows, optionRows };
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
    const normalizedTitle = normalizeString(body.title);
    const rawSections = Array.isArray(body.sections) ? body.sections : [];

    if (!normalizedTitle || !Array.isArray(body.sections)) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    const sections = normalizeSections(rawSections);

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

    const existingForms = formsRows.slice(1).map((row) =>
      rowToObject(HEADERS.forms, row)
    );
    const existingSections = sectionsRows.slice(1).map((row) =>
      rowToObject(HEADERS.sections, row)
    );
    const existingQuestions = questionsRows.slice(1).map((row) =>
      rowToObject(HEADERS.questions, row)
    );
    const existingOptions = optionsRows.slice(1).map((row) =>
      rowToObject(HEADERS.options, row)
    );

    const formId = normalizeString(body.id) || uuid();
    const now = new Date().toISOString();

    const previousForm = existingForms.find((row) => row.id === formId);
    const createdAt = previousForm?.created_at || now;
    const publishedAt = previousForm?.published_at || "";
    const status = previousForm?.status || "draft";

    const keptForms = existingForms.filter((row) => row.id !== formId);
    const keptSections = existingSections.filter((row) => row.form_id !== formId);
    const keptQuestions = existingQuestions.filter((row) => row.form_id !== formId);
    const keptOptions = existingOptions.filter((row) => row.form_id !== formId);

    const sectionRowsBuilt = buildSectionRows(formId, sections);
    const { questionRows, optionRows } = buildQuestionRowsAndOptionRows(
      formId,
      sections
    );

    const formRowObject: SheetRowObject = {
      id: formId,
      title: normalizedTitle,
      status,
      created_at: createdAt,
      updated_at: now,
      published_at: publishedAt
    };

    const nextFormRows: string[][] = [
      Array.from(HEADERS.forms),
      ...keptForms.map((row) => objectToRow(HEADERS.forms, row)),
      objectToRow(HEADERS.forms, formRowObject)
    ];

    const nextSectionRows: string[][] = [
      Array.from(HEADERS.sections),
      ...keptSections.map((row) => objectToRow(HEADERS.sections, row)),
      ...sectionRowsBuilt
    ];

    const nextQuestionRows: string[][] = [
      Array.from(HEADERS.questions),
      ...keptQuestions.map((row) => objectToRow(HEADERS.questions, row)),
      ...questionRows
    ];

    const nextOptionRows: string[][] = [
      Array.from(HEADERS.options),
      ...keptOptions.map((row) => objectToRow(HEADERS.options, row)),
      ...optionRows
    ];

    await Promise.all([
      rewriteTab(sheets, TABS.forms, nextFormRows),
      rewriteTab(sheets, TABS.sections, nextSectionRows),
      rewriteTab(sheets, TABS.questions, nextQuestionRows),
      rewriteTab(sheets, TABS.options, nextOptionRows)
    ]);

    return res.status(200).json({
      ok: true,
      id: formId
    });
  } catch (e: any) {
    console.error("save.ts error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message ?? "error"
    });
  }
}
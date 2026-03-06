import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "../_db.js";

type FormRow = {
  id: string;
  title: string;
};

type SectionRow = {
  id: string;
  title: string;
  description: string;
  sort_order: number;
};

type QuestionRow = {
  id: string;
  section_id: string;
  type: "text" | "date" | "multipleChoice" | "checkbox";
  label: string;
  required: boolean;
  sort_order: number;
};

type OptionRow = {
  question_id: string;
  label: string;
  sort_order: number;
};

type QuestionPayload = {
  id: string;
  type: QuestionRow["type"];
  label: string;
  required: boolean;
  options?: string[];
};

type SectionPayload = {
  id: string;
  title: string;
  description: string;
  questions: QuestionPayload[];
};

type FormPayload = {
  id: string;
  title: string;
  sections: SectionPayload[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const id = String(req.query.id ?? "");
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing id" });
  }

  const pool = getPool();

  try {
    const formR = await pool.query<FormRow>(
      `select id, title from forms where id = $1`,
      [id]
    );

    if (formR.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    const sectionsR = await pool.query<SectionRow>(
      `select id, title, description, sort_order
       from sections
       where form_id = $1
       order by sort_order asc`,
      [id]
    );

    const sectionIds = sectionsR.rows.map((s: SectionRow) => s.id);

    let questionsRows: QuestionRow[] = [];
    if (sectionIds.length > 0) {
      const questionsR = await pool.query<QuestionRow>(
        `select id, section_id, type, label, required, sort_order
         from questions
         where section_id = any($1::uuid[])
         order by section_id asc, sort_order asc`,
        [sectionIds]
      );
      questionsRows = questionsR.rows;
    }

    const questionIds = questionsRows.map((q: QuestionRow) => q.id);

    let optionsRows: OptionRow[] = [];
    if (questionIds.length > 0) {
      const optionsR = await pool.query<OptionRow>(
        `select question_id, label, sort_order
         from options
         where question_id = any($1::uuid[])
         order by question_id asc, sort_order asc`,
        [questionIds]
      );
      optionsRows = optionsR.rows;
    }

    const optionsByQ = new Map<string, string[]>();
    for (const o of optionsRows as OptionRow[]) {
      const arr = optionsByQ.get(o.question_id) ?? [];
      arr.push(o.label);
      optionsByQ.set(o.question_id, arr);
    }

    const questionsBySection = new Map<string, QuestionPayload[]>();

    for (const q of questionsRows as QuestionRow[]) {
      const arr = questionsBySection.get(q.section_id) ?? [];

      const needsOptions = q.type === "multipleChoice" || q.type === "checkbox";

      arr.push({
        id: q.id,
        type: q.type,
        label: q.label,
        required: q.required,
        options: needsOptions ? (optionsByQ.get(q.id) ?? []) : undefined
      });

      questionsBySection.set(q.section_id, arr);
    }

    const payload: FormPayload = {
      id: formR.rows[0].id,
      title: formR.rows[0].title,
      sections: sectionsR.rows.map((s: SectionRow) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        questions: questionsBySection.get(s.id) ?? []
      }))
    };

    return res.status(200).json({ ok: true, form: payload });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "error" });
  }
}

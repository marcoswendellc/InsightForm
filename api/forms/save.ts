import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "../_db.js";
import crypto from "crypto";

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

function normalizeBody(body: SaveRequestBody): FormPayload {
  if (body && typeof body === "object" && "form" in body && body.form) {
    return {
      ...body.form,
      id: body.id ?? body.form.id
    };
  }

  return body as FormPayload;
}

function serializeGoTo(goTo?: GoTo): string | null {
  if (!goTo) return null;
  return JSON.stringify(goTo);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = normalizeBody(req.body as SaveRequestBody);

  if (!body?.title || !Array.isArray(body.sections)) {
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const formId = body.id ?? uuid();

    await client.query(
      `
      insert into forms (id, title, updated_at)
      values ($1, $2, now())
      on conflict (id) do update
        set title = excluded.title,
            updated_at = now()
      `,
      [formId, body.title]
    );

    await client.query(
      `
      delete from options
      where question_id in (
        select q.id
        from questions q
        join sections s on s.id = q.section_id
        where s.form_id = $1
      )
      `,
      [formId]
    );

    await client.query(
      `
      delete from questions
      where section_id in (
        select id from sections where form_id = $1
      )
      `,
      [formId]
    );

    await client.query(`delete from sections where form_id = $1`, [formId]);

    for (let si = 0; si < body.sections.length; si++) {
      const s = body.sections[si];
      const sectionId = s.id ?? uuid();

      await client.query(
        `
        insert into sections (id, form_id, title, description, sort_order, go_to)
        values ($1, $2, $3, $4, $5, $6)
        `,
        [
          sectionId,
          formId,
          s.title ?? "",
          s.description ?? "",
          si,
          serializeGoTo(s.goTo)
        ]
      );

      for (let qi = 0; qi < s.questions.length; qi++) {
        const q = s.questions[qi];
        const questionId = q.id ?? uuid();

        await client.query(
          `
          insert into questions (id, section_id, type, label, required, jump_enabled, sort_order)
          values ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            questionId,
            sectionId,
            q.type,
            q.label ?? "",
            !!q.required,
            !!q.jumpEnabled,
            qi
          ]
        );

        const needsOptions = q.type === "multipleChoice" || q.type === "checkbox";
        const opts = needsOptions ? q.options ?? [] : [];

        for (let oi = 0; oi < opts.length; oi++) {
          const opt = opts[oi];
          const optionId = opt.id ?? uuid();

          await client.query(
            `
            insert into options (id, question_id, label, is_other, go_to, sort_order)
            values ($1, $2, $3, $4, $5, $6)
            `,
            [
              optionId,
              questionId,
              opt.label ?? "",
              !!opt.isOther,
              serializeGoTo(opt.goTo),
              oi
            ]
          );
        }
      }
    }

    await client.query("COMMIT");
    return res.status(200).json({ ok: true, id: formId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    return res.status(500).json({ ok: false, error: e?.message ?? "error" });
  } finally {
    client.release();
  }
}
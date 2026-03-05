import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "../_db";
import type { FormPayload } from "../_types";
import crypto from "crypto";

const uuid = () => crypto.randomUUID();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as FormPayload;

  if (!body?.title || !Array.isArray(body.sections)) {
    return res.status(400).json({ error: "Invalid payload" });
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

    await client.query(`delete from sections where form_id = $1`, [formId]);

    for (let si = 0; si < body.sections.length; si++) {
      const s = body.sections[si];
      const sectionId = s.id ?? uuid();

      await client.query(
        `
        insert into sections (id, form_id, title, description, sort_order)
        values ($1, $2, $3, $4, $5)
        `,
        [sectionId, formId, s.title ?? "", s.description ?? "", si]
      );

      for (let qi = 0; qi < s.questions.length; qi++) {
        const q = s.questions[qi];
        const questionId = q.id ?? uuid();

        await client.query(
          `
          insert into questions (id, section_id, type, label, required, sort_order)
          values ($1, $2, $3, $4, $5, $6)
          `,
          [
            questionId,
            sectionId,
            q.type,
            q.label ?? "",
            !!q.required,
            qi
          ]
        );

        const needsOptions = q.type === "multipleChoice" || q.type === "checkbox";
        const opts = needsOptions ? (q.options ?? []) : [];

        for (let oi = 0; oi < opts.length; oi++) {
          await client.query(
            `
            insert into options (id, question_id, label, sort_order)
            values ($1, $2, $3, $4)
            `,
            [uuid(), questionId, opts[oi], oi]
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

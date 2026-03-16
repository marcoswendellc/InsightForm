import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "../_db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const pool = getPool();

  try {
    const r = await pool.query(
      `select id, title, created_at, updated_at
       from forms
       order by updated_at desc
       limit 100`
    );

    return res.status(200).json({ ok: true, forms: r.rows });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "error" });
  }
}

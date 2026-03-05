import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const r = await pool.query("select now() as now");
    return res.status(200).json({ ok: true, now: r.rows[0].now });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "error" });
  }
}

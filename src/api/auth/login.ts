import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { getPool } from "../_db";
import { signToken } from "../_auth";

type UserRow = {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  role: "user" | "admin";
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Missing username or password" });
  }

  const pool = getPool();

  try {
    const r = await pool.query<UserRow>(
      `select id, name, username, password_hash, role
       from users
       where username = $1
       limit 1`,
      [username]
    );

    if (r.rowCount === 0) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    });

    return res.status(200).json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "error" });
  }
}

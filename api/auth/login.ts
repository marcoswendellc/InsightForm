import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { readSheetRange } from "../_gsheets";
import { signToken } from "../_auth";

type Role = "user" | "admin";

type UserRow = {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  role: Role;
};

function rowToUser(headers: string[], row: string[]): UserRow {
  const obj: any = {};
  headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
  return obj as UserRow;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { username, password } = (req.body ?? {}) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Missing username or password" });
  }

  try {
    const tab = process.env.GOOGLE_SHEET_USERS_TAB || "users";

    // Lê a aba inteira (simples e direto). Depois a gente otimiza se quiser.
    const values = await readSheetRange(`${tab}!A:Z`);
    if (values.length < 2) {
      return res.status(500).json({ ok: false, error: "Users sheet is empty" });
    }

    const headers = values[0].map((h) => String(h).trim());
    const rows = values.slice(1);

    const users = rows
      .filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""))
      .map((r) => rowToUser(headers, r.map((c) => String(c))));

    const found = users.find((u) => u.username === username.trim());
    if (!found) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, found.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken({
      id: found.id,
      name: found.name,
      username: found.username,
      role: found.role
    });

    return res.status(200).json({
      ok: true,
      token,
      user: { id: found.id, name: found.name, username: found.username, role: found.role }
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "error" });
  }
}
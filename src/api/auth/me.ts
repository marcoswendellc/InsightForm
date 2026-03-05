import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, verifyToken } from "../_auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

  try {
    const user = verifyToken(token);
    return res.status(200).json({ ok: true, user });
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

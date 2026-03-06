// api/auth/me.ts
import type { VercelResponse } from "@vercel/node";
import { withAuth, type AuthedRequest } from "../_middleware/withAuth.js";

export default withAuth(async function handler(req: AuthedRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  return res.status(200).json({
    ok: true,
    user: req.user
  });
}); 
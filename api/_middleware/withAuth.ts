import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, type JwtUser } from "../_auth.js";

type AuthedRequest = VercelRequest & {
  user?: JwtUser;
};

export function withAuth(
  handler: (req: AuthedRequest, res: VercelResponse) => unknown | Promise<unknown>
) {
  return async (req: AuthedRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ ok: false, error: "Invalid token" });
    }

    req.user = {
      id: payload.id,
      name: payload.name,
      username: payload.username,
      role: payload.role
    };

    return handler(req, res);
  };
}
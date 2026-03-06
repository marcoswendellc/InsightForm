// api/_middleware/withAuth.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, type JwtUser } from "../_auth.ts";

export type AuthedRequest = VercelRequest & {
  user: JwtUser;
};

function getBearerToken(req: VercelRequest) {
  const h = req.headers.authorization || "";
  const [type, token] = h.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function withAuth(
  handler: (req: AuthedRequest, res: VercelResponse) => any,
  opts?: { roles?: Array<JwtUser["role"]> }
) {
  return async function (req: VercelRequest, res: VercelResponse) {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ ok: false, error: "Missing token" });
    }

    try {
      const payload = verifyToken(token);

      const user: JwtUser = {
        id: payload.id,
        name: payload.name,
        username: payload.username,
        role: payload.role
      };

      if (opts?.roles?.length && !opts.roles.includes(user.role)) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      (req as AuthedRequest).user = user;
      return handler(req as AuthedRequest, res);
    } catch {
      return res.status(401).json({ ok: false, error: "Invalid or expired token" });
    }
  };
}
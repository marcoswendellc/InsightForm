import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: "user" | "admin";
};

export function signToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");

  return jwt.sign(
    { sub: user.id, name: user.name, username: user.username, role: user.role },
    secret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): AuthUser {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");

  const decoded = jwt.verify(token, secret) as any;

  return {
    id: String(decoded.sub),
    name: String(decoded.name),
    username: String(decoded.username),
    role: decoded.role as "user" | "admin"
  };
}

export function getBearerToken(header?: string) {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

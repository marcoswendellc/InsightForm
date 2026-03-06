// api/_auth.ts
import jwt from "jsonwebtoken";

export type JwtUser = {
  id: string;
  name: string;
  username: string;
  role: "user" | "admin";
};

type JwtPayload = JwtUser & {
  iat?: number;
  exp?: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET env var");
  return secret;
}

export function signToken(user: JwtUser) {
  const secret = getJwtSecret();

  // Ajuste expiração como quiser
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as JwtPayload;
}
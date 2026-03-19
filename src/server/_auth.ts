import type { VercelRequest } from "@vercel/node";
import jwt from "jsonwebtoken";

export type Role = "user" | "admin";

export type JwtUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
};

export type SafeUser = JwtUser;

const JWT_SECRET = process.env.JWT_SECRET;

function assertJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
}

export function signToken(user: JwtUser) {
  assertJwtSecret();

  return jwt.sign(user, JWT_SECRET!, {
    expiresIn: "7d"
  });
}

function getBearerToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
}

export function verifyToken(token: string): JwtUser | null {
  try {
    assertJwtSecret();

    const decoded = jwt.verify(token, JWT_SECRET!) as JwtUser;

    if (!decoded?.id || !decoded?.username || !decoded?.role) {
      return null;
    }

    return {
      id: decoded.id,
      name: decoded.name,
      username: decoded.username,
      role: decoded.role
    };
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: VercelRequest): JwtUser | null {
  const token = getBearerToken(req);
  if (!token) return null;

  return verifyToken(token);
}

export function requireUser(req: VercelRequest): JwtUser {
  const user = getUserFromRequest(req);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export function requireAdmin(req: VercelRequest): JwtUser {
  const user = requireUser(req);

  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return user;
}

export function isPublishedStatus(status?: string) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "published" || normalized === "active";
}
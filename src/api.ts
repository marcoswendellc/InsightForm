export const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "") || "";

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  if (!API_BASE) {
    return path;
  }

  return `${API_BASE}${path}`;
}

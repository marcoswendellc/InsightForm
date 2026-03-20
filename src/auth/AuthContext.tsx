import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiUrl } from "../api";

export type SafeUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: "user" | "admin";
};

type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

type AuthState = {
  user: SafeUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refresh: () => Promise<void>;
  authHeader: () => Record<string, string>;
};

type LoginResponse =
  | { ok: true; token: string; user: SafeUser }
  | { ok: false; error?: string };

type MeResponse =
  | { ok: true; user: SafeUser }
  | { ok: false; error?: string };

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = "auth_user_v1";
const TOKEN_KEY = "auth_token_v1";

function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function loadToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function normalizeUser(input: SafeUser | null | undefined): SafeUser | null {
  if (!input) return null;

  return {
    id: String(input.id ?? "").trim(),
    name: String(input.name ?? "").trim(),
    username: String(input.username ?? "").trim(),
    email: input.email ? String(input.email).trim() : undefined,
    role: input.role === "admin" ? "admin" : "user"
  };
}

async function safeReadJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(() =>
    normalizeUser(loadJSON<SafeUser>(USER_KEY))
  );

  const [token, setToken] = useState<string | null>(() => loadToken(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(
    (nextUser: SafeUser | null, nextToken: string | null) => {
      const normalizedUser = normalizeUser(nextUser);

      setUser(normalizedUser);
      setToken(nextToken);

      try {
        if (normalizedUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        } else {
          localStorage.removeItem(USER_KEY);
        }

        if (nextToken) {
          localStorage.setItem(TOKEN_KEY, nextToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // ignora falha de storage
      }
    },
    []
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const authHeader = useCallback((): Record<string, string> => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`
    };
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/auth/me"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await safeReadJson<MeResponse>(response);

      if (!response.ok || !data || !data.ok) {
        persist(null, null);
        return;
      }

      persist(data.user, token);
    } catch {
      // falha de rede: mantém sessão local
    } finally {
      setIsLoading(false);
    }
  }, [token, persist]);

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      try {
        const response = await fetch(apiUrl("/api/auth/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, password })
        });

        const data = await safeReadJson<LoginResponse>(response);

        if (!response.ok || !data) {
          return {
            ok: false,
            message: "Usuário ou senha inválidos."
          };
        }

        if (!data.ok) {
          return {
            ok: false,
            message: data.error ?? "Usuário ou senha inválidos."
          };
        }

        persist(data.user, data.token);

        return { ok: true };
      } catch {
        return {
          ok: false,
          message: "Erro de conexão. Tente novamente."
        };
      }
    },
    [persist]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthState>(() => {
    return {
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
      refresh,
      authHeader
    };
  }, [user, token, isLoading, login, logout, refresh, authHeader]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
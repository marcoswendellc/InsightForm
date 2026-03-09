import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SafeUser = {
  id: string;
  name: string;
  username: string;
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

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = "auth_user_v1";
const TOKEN_KEY = "auth_token_v1";

type LoginResponse =
  | { ok: true; token: string; user: SafeUser }
  | { ok: false; error?: string };

type MeResponse =
  | { ok: true; user: SafeUser }
  | { ok: false; error?: string };

function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function safeReadJson<T>(r: Response): Promise<T | null> {
  try {
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(() => loadJSON<SafeUser>(USER_KEY));

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const persist = (nextUser: SafeUser | null, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }

    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logout = () => {
    persist(null, null);
  };

  const authHeader = (): Record<string, string> => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
      return h;
  };

  const refresh = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const r = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await safeReadJson<MeResponse>(r);

      if (!r.ok || !data || !data.ok) {
        logout();
        return;
      }

      persist(data.user, token);
    } catch {
      // falha de rede: mantém sessão
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await safeReadJson<LoginResponse>(r);

      if (!r.ok || !data) {
        return { ok: false, message: "Usuário ou senha inválidos." };
      }

      if (!data.ok) {
        return { ok: false, message: data.error ?? "Usuário ou senha inválidos." };
      }

      persist(data.user, data.token);
      return { ok: true };
    } catch {
      return { ok: false, message: "Erro de conexão. Tente novamente." };
    }
  };

  const value: AuthState = useMemo(() => {
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
  }, [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return ctx;
}
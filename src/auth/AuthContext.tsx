import { createContext, useContext, useMemo, useState } from "react";
import type { AppUser } from "./users";
import { USERS } from "./users";

type AuthState = {
  user: Omit<AppUser, "password"> | null;
  login: (username: string, password: string) => { ok: boolean; message?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<AppUser, "password"> | null>(() => {
    const raw = localStorage.getItem("auth_user_v1");
    return raw ? (JSON.parse(raw) as Omit<AppUser, "password">) : null;
  });

  const value = useMemo<AuthState>(() => {
    return {
      user,
      login: (username, password) => {
        const found = USERS.find((u) => u.username === username && u.password === password);
        if (!found) return { ok: false, message: "Usuário ou senha inválidos." };

        const safe = { username: found.username, role: found.role, name: found.name };
        setUser(safe);
        localStorage.setItem("auth_user_v1", JSON.stringify(safe));
        return { ok: true };
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem("auth_user_v1");
      }
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

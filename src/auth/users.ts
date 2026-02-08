export type Role = "usuario" | "admin";

export type AppUser = {
  username: string;
  password: string;
  role: Role;
  name: string;
};

export const USERS: AppUser[] = [
  { username: "user", password: "123", role: "usuario", name: "Usuário" },
  { username: "admin", password: "123", role: "admin", name: "Administrador" }
];

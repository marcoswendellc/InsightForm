import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logoTerral from "../assets/logo-terral.png";

import {
  Layout,
  Topbar,
  Brand,
  BrandMark,
  BrandText,
  BrandTitle,
  BrandSubtitle,
  Content,
  Right,
  UserBlock,
  UserAvatar,
  Chip,
  Btn
} from "./styles";

function getInitials(name?: string) {
  if (!name) return "U";

  const parts = name.trim().split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";

  return `${first}${second}`.toUpperCase();
}

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <Topbar>
        <Brand>
          <BrandMark>
            <img src={logoTerral} alt="Terral Shopping Centers" />
          </BrandMark>

          <BrandText>
            <BrandTitle>Formulários</BrandTitle>
            <BrandSubtitle>Sistema de Briefing Digital</BrandSubtitle>
          </BrandText>
        </Brand>

        <Right>
          <UserBlock>
            <UserAvatar>{getInitials(user?.name)}</UserAvatar>

            <Chip>
              <strong>{user?.name ?? "Usuário"}</strong>
              <span>•</span>
              {user?.role ?? "perfil"}
            </Chip>
          </UserBlock>

          <Btn
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Sair
          </Btn>
        </Right>
      </Topbar>

      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
}
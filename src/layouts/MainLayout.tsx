import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
  Chip,
  Btn
} from "./styles";
import logoTerral from "../assets/logo-terral.png";

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <Topbar>
        <Brand>
          <BrandMark>
            <img src={logoTerral} alt="TERRAL" />
          </BrandMark>

          <BrandText>
            <BrandTitle>Formulários</BrandTitle>
            <BrandSubtitle>Sistema de Briefing Digital</BrandSubtitle>
          </BrandText>
        </Brand>

        <Right>
          <Chip>
            {user?.name} • {user?.role}
          </Chip>

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
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Layout, Topbar, Brand, Content, Right, Chip, Btn } from "./styles";

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  //const isAdmin = user?.role === "admin";

  return (
    <Layout>
      <Topbar>
        <Brand>Briefing Builder</Brand>

        <Right>
          <Chip>{user?.name} • {user?.role}</Chip>
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

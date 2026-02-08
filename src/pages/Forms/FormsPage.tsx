import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { PencilSimple, Eye, FileText } from "phosphor-react";
import { Card, HeaderRow, Title, Input, Actions, IconBtn, Hint } from "./styles";

export default function FormsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <Card>
        <Title>Acesso restrito</Title>
        <Hint>Somente administradores podem acessar “Formulários”.</Hint>
      </Card>
    );
  }

  return (
    <Card>
      <HeaderRow>
        <div style={{ flex: 1 }}>
          <Title>Formulário</Title>
          <Hint>Digite o nome do formulário e escolha uma ação.</Hint>
        </div>

        <div style={{ flex: 1 }}>
          <Input placeholder="Nome do formulário..." />
        </div>

        <Actions>
          <IconBtn title="Editar" onClick={() => navigate("/builder")}>
            <PencilSimple size={20} weight="bold" />
          </IconBtn>
          <IconBtn title="Visualizar" onClick={() => navigate("/builder?mode=preview")}>
            <Eye size={20} weight="bold" />
          </IconBtn>
          <IconBtn title="Novo" onClick={() => navigate("/builder?new=1")}>
            <FileText size={20} weight="bold" />
          </IconBtn>
        </Actions>
      </HeaderRow>

      <Hint style={{ marginTop: 14 }}>
        Aqui depois a gente lista os formulários salvos (API/DB/localStorage). Por enquanto já abre o builder.
      </Hint>
    </Card>
  );
}

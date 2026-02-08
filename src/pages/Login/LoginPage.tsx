import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Card, Page, Title, Subtitle, Field, Row, Btn, Hint } from "./styles";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState<string | null>(null);

  return (
    <Page>
      <Card>
        <Title>Entrar</Title>
        <Subtitle>Bem-vindo! Vamos criar briefs que não dão retrabalho 😄</Subtitle>

        <Field value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" />
        <Field value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" type="password" />

        {error && <Hint data-err>{error}</Hint>}

        <Row>
          <Btn
            onClick={() => {
              const res = login(username.trim(), password);
              if (!res.ok) return setError(res.message ?? "Erro ao entrar");
              navigate("/briefing");
            }}
          >
            Entrar
          </Btn>
        </Row>

        <Hint>
          Teste: <b>admin/123</b> (admin) • <b>user/123</b> (usuario)
        </Hint>
      </Card>
    </Page>
  );
}

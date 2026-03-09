import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Card, Page, Title, Subtitle, Field, Row, Btn, Hint } from "./styles";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // se já estiver logado, manda pra briefing direto
  if (isAuthenticated) {
  navigate("/forms", { replace: true });
  }

  const from = (location.state as any)?.from?.pathname ?? "/forms";

  return (
    <Page>
      <Card>
        <Title>Entrar</Title>
        <Subtitle>Bem-vindo ao Forms</Subtitle>

        <Field
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuário"
        />
        <Field
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          type="password"
        />

        {error && <Hint data-err>{error}</Hint>}

        <Row>
          <Btn
            disabled={loading}
            onClick={async () => {
              setError(null);
              setLoading(true);

              const res = await login(username.trim(), password);
              setLoading(false);

              if (!res.ok) return setError(res.message);

              navigate(from, { replace: true });
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Btn>
        </Row>
      </Card>
    </Page>
  );
}
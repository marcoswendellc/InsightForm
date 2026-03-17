import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Card, Page, Title, Subtitle, Field, Row, Btn, Hint } from "./styles";

type LocationState = {
  from?: string;
};

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as LocationState | null)?.from || "/builder";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/builder", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleLogin() {
    setError(null);
    setLoading(true);

    try {
      const res = await login(username.trim(), password);

      if (!res.ok) {
        setError(res.message);
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleLogin();
            }
          }}
        />

        {error && <Hint data-err>{error}</Hint>}

        <Row>
          <Btn disabled={loading} onClick={handleLogin}>
            {loading ? "Entrando..." : "Entrar"}
          </Btn>
        </Row>
      </Card>
    </Page>
  );
}
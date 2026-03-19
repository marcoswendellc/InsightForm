import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  Page,
  Shell,
  Brand,
  BrandMark,
  HeaderBlock,
  Title,
  Subtitle,
  Form,
  FieldGroup,
  Label,
  Field,
  Btn,
  Hint,
  Footer
} from "./styles";

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
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await login(username.trim(), password);

      if (!res.ok) {
        setError(res.message);
        return;
      }

      navigate(from, { replace: true });
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Shell>
        <Brand>
          <BrandMark>TERRAL</BrandMark>
        </Brand>

        <HeaderBlock>
          <Title>Bem-vindo</Title>
          <Subtitle>Acesse o Briefing de Desdobramento Digital</Subtitle>
        </HeaderBlock>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <FieldGroup>
            <Label htmlFor="username">Login</Label>
            <Field
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
              disabled={loading}
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="password">Senha</Label>
            <Field
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
          </FieldGroup>

          {error && <Hint data-err="true">{error}</Hint>}

          <Btn type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Btn>
        </Form>

        <Footer>© 2026 Terral Shopping Centers</Footer>
      </Shell>
    </Page>
  );
}
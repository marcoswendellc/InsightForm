import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import logo from "../../assets/logo-terral.png";
import {
  Page,
  Shell,
  Brand,
  Logo,
  HeaderBlock,
  Title,
  Subtitle,
  FormCard,
  Form,
  FieldGroup,
  Label,
  Field,
  Btn,
  Hint,
  Footer,
  ActionsRow,
  SecondaryAction,
  Spinner,
  ErrorIcon
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
        setError(res.message || "Usuário ou senha inválidos.");
        return;
      }

      navigate(from, { replace: true });
    } catch {
      setError("Não foi possível entrar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Shell>
        <Brand>
          <Logo src={logo} alt="Terral Shopping Centers" />
        </Brand>

        <HeaderBlock>
          <Title>Bem-vindo</Title>
          <Subtitle>Acesse o Briefing de Desdobramento Digital</Subtitle>
        </HeaderBlock>

        <FormCard>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleLogin();
                  }
                }}
              />
            </FieldGroup>

            <ActionsRow>
              <SecondaryAction
                type="button"
                onClick={() => {
                  alert("Fluxo de recuperação de senha ainda não implementado.");
                }}
              >
              </SecondaryAction>
            </ActionsRow>

            {error && (
              <Hint data-err="true">
                <ErrorIcon>⚠</ErrorIcon>
                <div>
                  <div style={{ fontWeight: 700 }}>Não foi possível entrar.</div>
                  <div>{error}</div>
                </div>
              </Hint>
            )}

            <Btn type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Btn>
          </Form>
        </FormCard>

        <Footer>© 2026 Terral Shopping Centers</Footer>
      </Shell>
    </Page>
  );
}
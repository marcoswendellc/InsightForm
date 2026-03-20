import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoTerral from "../../assets/logo-terral.png";

import {
  Page,
  Aside,
  AsideInner,
  BrandRow,
  BrandMark,
  BrandText,
  BrandTitle,
  HeroCard,
  HeroTitle,
  HeroText,
  Bullets,
  Bullet,
  Main,
  LoginCard,
  MobileBrand,
  MobileBrandRow,
  MobileBrandMark,
  MobileBrandText,
  MobileBrandTitle,
  CardHeader,
  Title,
  Subtitle,
  Form,
  Field,
  Label,
  Input,
  ErrorText,
  SubmitButton,
  FooterText
} from "./styles";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      // coloque aqui sua lógica real de login
      await new Promise((resolve) => setTimeout(resolve, 800));

      navigate("/");
    } catch {
      setError("Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Aside>
        <AsideInner>
          <BrandRow>
            <BrandMark>
              <img src={logoTerral} alt="Terral Shopping Centers" />
            </BrandMark>

            <BrandText>
              <BrandTitle>Sistema de briefing digital</BrandTitle>
            </BrandText>
          </BrandRow>

          <HeroCard>
            <HeroTitle>
              Crie briefings de forma simples <br></br>e padronizada
            </HeroTitle>

            <HeroText>
              Responda perguntas guiadas para organizar sua solicitação.
            </HeroText>

            <Bullets>
              <Bullet>Perguntas certas para cada tipo de demanda</Bullet>
              <Bullet>Menos erros e retrabalhos nas solicitações</Bullet>
              <Bullet>Documento final pronto para compartilhar</Bullet>
            </Bullets>
          </HeroCard>
        </AsideInner>
      </Aside>

      <Main>
        <LoginCard>
          <MobileBrand>
            <MobileBrandRow>
              <MobileBrandMark>
                <img src={logoTerral} alt="Terral Shopping Centers" />
              </MobileBrandMark>

              <MobileBrandText>
                <MobileBrandTitle>Sistema de briefing digital</MobileBrandTitle>
              </MobileBrandText>
            </MobileBrandRow>
          </MobileBrand>

          <CardHeader>
            <Title>Entrar</Title>
            <Subtitle>
              Use suas credenciais para acessar a plataforma.
            </Subtitle>
          </CardHeader>

          <Form onSubmit={handleSubmit}>
            <Field>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@terral.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error && <ErrorText>{error}</ErrorText>}

            <SubmitButton type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </SubmitButton>
          </Form>

          <FooterText>
            Terral Shopping Centers • Plataforma interna
          </FooterText>
        </LoginCard>
      </Main>
    </Page>
  );
}
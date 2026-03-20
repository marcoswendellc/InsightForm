import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Mock para teste local - substitua com sua lógica real
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  // Exemplo: aceita qualquer usuario/senha para teste
  if (username && password) {
    return res.json({
      ok: true,
      token: "mock-token-" + Date.now(),
      user: {
        id: "1",
        name: "Usuário Teste",
        username: username,
        email: username,
        role: "user"
      }
    });
  }

  res.status(401).json({
    ok: false,
    error: "Usuário ou senha inválidos"
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "Token inválido"
    });
  }

  res.json({
    ok: true,
    user: {
      id: "1",
      name: "Usuário Teste",
      username: "teste@email.com",
      email: "teste@email.com",
      role: "user"
    }
  });
});

app.listen(PORT, () => {
  console.log(`✓ Servidor local rodando em http://localhost:${PORT}`);
  console.log(`  Frontend: http://localhost:5173`);
  console.log(`  API Proxy: http://localhost:${PORT}/api`);
});

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { FormDefinition } from "./types";
import FormResponsePrintPage from "./components/FormResponsePrintPage";

async function parseJsonResponse(response: Response) {
  const rawText = await response.text();

  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(rawText || "Resposta inválida do servidor.");
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Não foi possível concluir a operação.");
  }

  return data;
}

export default function FormResponsePrintRoute() {
  const [params] = useSearchParams();
  const { authHeader } = useAuth();

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formId = params.get("formId")?.trim() || "";

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      setError("Formulário não informado.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/forms/get?id=${encodeURIComponent(formId)}`,
          {
            headers: {
              ...authHeader()
            }
          }
        );

        const data = await parseJsonResponse(response);

        if (cancelled) return;

        setForm(data.form ?? null);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar formulário para impressão."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [formId, authHeader]);

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando formulário...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: "#b42318" }}>{error}</div>;
  }

  if (!form) {
    return <div style={{ padding: 24 }}>Formulário não encontrado.</div>;
  }

  return <FormResponsePrintPage form={form} />;
}
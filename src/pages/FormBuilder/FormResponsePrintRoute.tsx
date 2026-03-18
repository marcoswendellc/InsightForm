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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const formId = params.get("formId")?.trim() || "";

  useEffect(() => {
    if (!formId) {
      setIsLoading(false);
      setLoadError("Formulário não informado.");
      return;
    }

    let cancelled = false;

    const loadForm = async () => {
      setIsLoading(true);
      setLoadError("");

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
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar formulário para gerar PDF."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadForm();

    return () => {
      cancelled = true;
    };
  }, [authHeader, formId]);

  if (isLoading) {
    return <div style={{ padding: 24 }}>Carregando formulário...</div>;
  }

  if (loadError) {
    return <div style={{ padding: 24, color: "#b42318" }}>{loadError}</div>;
  }

  if (!form) {
    return <div style={{ padding: 24 }}>Formulário não encontrado.</div>;
  }

  return (
    <FormResponsePrintPage
      form={form}
      onDownloaded={() => {
        // espaço para comportamento futuro após download
      }}
    />
  );
}
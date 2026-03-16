import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import type { FormDefinition } from "../types";

type Props = {
  form: FormDefinition;
};

type ResponseData = {
  id: string;
  form_id: string;
  form_title: string;
  submitted_at?: string;
  respondent_id?: string;
  respondent_name?: string;
  respondent_email?: string;
  answers?: Record<string, string | string[]>;
};

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

function formatDateTime(value?: string) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function formatDateOnly(value?: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function normalizeAnswerValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "—";
}

function getBooleanLabel(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const normalized = String(raw).trim().toLowerCase();

  if (["true", "1", "sim", "yes"].includes(normalized)) return "Sim";
  if (["false", "0", "não", "nao", "no"].includes(normalized)) return "Não";

  return raw || "—";
}

function getAnswerLabel(params: {
  questionType: string;
  value: string | string[] | undefined;
  options?: Array<{
    id: string;
    label: string;
  }>;
}) {
  const { questionType, value, options } = params;

  if (questionType === "multipleChoice") {
    const selectedId = typeof value === "string" ? value : "";
    const selected = options?.find((opt) => opt.id === selectedId);
    return selected?.label || "—";
  }

  if (questionType === "checkbox") {
    const ids = Array.isArray(value) ? value : [];
    if (!ids.length) return "—";

    const labels = ids.map((id) => {
      const found = options?.find((opt) => opt.id === id);
      return found?.label || id;
    });

    return labels.join(", ");
  }

  if (questionType === "date") {
    return formatDateOnly(typeof value === "string" ? value : "");
  }

  if (questionType === "boolean") {
    return getBooleanLabel(value);
  }

  return normalizeAnswerValue(value);
}

export default function FormResponsePrintPage({ form }: Props) {
  const [params] = useSearchParams();
  const { authHeader } = useAuth();

  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const responseId = params.get("responseId")?.trim() || "";

  useEffect(() => {
    const currentFormId = form.id?.trim() || "";
    const currentResponseId = responseId.trim();

    if (!currentResponseId) {
      setIsLoading(false);
      setLoadError("Resposta não informada.");
      return;
    }

    if (!currentFormId) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `/api/forms/responses/get?formId=${encodeURIComponent(
            currentFormId
          )}&responseId=${encodeURIComponent(currentResponseId)}`,
          {
            headers: {
              ...authHeader()
            }
          }
        );

        const data = await parseJsonResponse(response);

        if (cancelled) return;

        setResponseData(data.response ?? null);
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar resposta para impressão.";

        setLoadError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [form.id, responseId, authHeader]);

  const respondentLabel = useMemo(() => {
    return (
      responseData?.respondent_name ||
      responseData?.respondent_email ||
      "Não informado"
    );
  }, [responseData]);

  const printableSections = useMemo(() => {
    const answers = responseData?.answers ?? {};

    return form.sections.map((section) => ({
      ...section,
      printableQuestions: section.questions.map((question) => ({
        id: question.id,
        label: question.label,
        type: question.type,
        answer: getAnswerLabel({
          questionType: question.type,
          value: answers[question.id],
          options: question.options
        })
      }))
    }));
  }, [form, responseData]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        Carregando resposta para impressão...
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          color: "#d93025",
          fontWeight: 500
        }}
      >
        {loadError}
      </div>
    );
  }

  if (!responseData) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          color: "#5f6368"
        }}
      >
        Nenhuma resposta encontrada para impressão.
      </div>
    );
  }

  return (
    <div>
      <style>
        {`
          @page {
            size: auto;
            margin: 14mm;
          }

          @media print {
            .print-actions {
              display: none !important;
            }

            body {
              background: #fff !important;
            }

            .print-sheet {
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
            }

            .print-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .print-question {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div
        className="print-actions"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16
        }}
      >
        <button
          onClick={handlePrint}
          style={{
            background: "#673ab7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Imprimir / Salvar em PDF
        </button>
      </div>

      <div
        className="print-sheet"
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              color: "#202124"
            }}
          >
            {form.title || responseData.form_title || "Formulário"}
          </h1>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 6,
              color: "#5f6368",
              fontSize: 14
            }}
          >
            <div>
              <strong>Respondente:</strong> {respondentLabel}
            </div>
            <div>
              <strong>Data da resposta:</strong>{" "}
              {formatDateTime(responseData.submitted_at)}
            </div>
            <div>
              <strong>ID da resposta:</strong> {responseData.id || "—"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {printableSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="print-section"
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: 18
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#202124"
                }}
              >
                {section.title || `Seção ${sectionIndex + 1}`}
              </div>

              {section.description ? (
                <div
                  style={{
                    marginTop: 6,
                    color: "#5f6368",
                    lineHeight: 1.5
                  }}
                >
                  {section.description}
                </div>
              ) : null}

              <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                {section.printableQuestions.map((question, questionIndex) => (
                  <div
                    key={question.id}
                    className="print-question"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.03)"
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#202124"
                      }}
                    >
                      {sectionIndex + 1}.{questionIndex + 1} {question.label}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        color: "#3c4043",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {question.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
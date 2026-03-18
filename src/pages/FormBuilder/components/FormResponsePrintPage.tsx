import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import type { FormDefinition } from "../types";
import html2pdf from "html2pdf.js";

type Props = {
  form: FormDefinition;
  onDownloaded?: () => void;
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

type PrintableQuestion = {
  id: string;
  label?: string;
  answer: string;
};

type PrintableSection = {
  id: string;
  title?: string;
  printableQuestions: PrintableQuestion[];
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

function formatDateAnswer(value?: string) {
  if (!value) return "";

  if (value.includes("T")) {
    const [datePart, timePart] = value.split("T");

    const date = new Date(`${datePart}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    const formattedDate = date.toLocaleDateString("pt-BR");
    return timePart ? `${formattedDate}, ${timePart.slice(0, 5)}` : formattedDate;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function hasMeaningfulAnswer(
  questionType: string,
  value: string | string[] | undefined,
  options?: Array<{ id: string; label: string }>
) {
  if (questionType === "checkbox") {
    return Array.isArray(value) && value.length > 0;
  }

  if (questionType === "multipleChoice") {
    if (typeof value !== "string" || !value.trim()) return false;
    return !!options?.some((opt) => opt.id === value);
  }

  if (questionType === "date") {
    return typeof value === "string" && value.trim() !== "";
  }

  return typeof value === "string" && value.trim() !== "";
}

function normalizeAnswerValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "";
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function getBooleanLabel(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const normalized = String(raw).trim().toLowerCase();

  if (["true", "1", "sim", "yes"].includes(normalized)) return "Sim";
  if (["false", "0", "não", "nao", "no"].includes(normalized)) return "Não";

  return raw || "";
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
    return selected?.label || "";
  }

  if (questionType === "checkbox") {
    const ids = Array.isArray(value) ? value : [];
    if (!ids.length) return "";

    const labels = ids
      .map((id) => {
        const found = options?.find((opt) => opt.id === id);
        return found?.label || "";
      })
      .filter(Boolean);

    return labels.join(", ");
  }

  if (questionType === "date") {
    return formatDateAnswer(typeof value === "string" ? value : "");
  }

  if (questionType === "boolean") {
    return getBooleanLabel(value);
  }

  return normalizeAnswerValue(value);
}

function sanitizeFileName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "formulario"
  );
}

function buildPrintableSections(
  form: FormDefinition,
  responseData: ResponseData | null
): PrintableSection[] {
  const answers = responseData?.answers ?? {};

  return form.sections
    .map((section) => {
      const printableQuestions = section.questions
        .filter((question) =>
          hasMeaningfulAnswer(question.type, answers[question.id], question.options)
        )
        .map((question) => ({
          id: question.id,
          label: question.label,
          answer: getAnswerLabel({
            questionType: question.type,
            value: answers[question.id],
            options: question.options
          })
        }))
        .filter((question) => question.answer.trim() !== "");

      return {
        id: section.id,
        title: section.title,
        printableQuestions
      };
    })
    .filter((section) => section.printableQuestions.length > 0);
}

function getPdfFileName(form: FormDefinition, responseData: ResponseData | null) {
  return `${sanitizeFileName(
    form.title || responseData?.form_title || "formulario"
  )}.pdf`;
}

export default function FormResponsePrintPage({ form, onDownloaded }: Props) {
  const [params] = useSearchParams();
  const { authHeader } = useAuth();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const responseId = params.get("responseId")?.trim() || "";

  useEffect(() => {
    const currentFormId = form.id?.trim() || "";
    const currentResponseId = responseId.trim();

    if (!currentResponseId) {
      setIsLoading(false);
      setLoadError("Resposta não informada.");
      return;
    }

    if (!currentFormId) return;

    let cancelled = false;

    const loadResponse = async () => {
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

        setLoadError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar resposta para impressão."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadResponse();

    return () => {
      cancelled = true;
    };
  }, [authHeader, form.id, responseId]);

  const respondentLabel = useMemo(() => {
    return (
      responseData?.respondent_name ||
      responseData?.respondent_email ||
      "Não informado"
    );
  }, [responseData]);

  const printableSections = useMemo(() => {
    return buildPrintableSections(form, responseData);
  }, [form, responseData]);

  useEffect(() => {
    if (isLoading || loadError || !responseData || isGeneratingPdf) return;

    let cancelled = false;

    const generatePdf = async () => {
      const element = contentRef.current;
      if (!element) return;

      try {
        setIsGeneratingPdf(true);

        const options = {
          margin: [12, 12, 12, 12] as [number, number, number, number],
          filename: getPdfFileName(form, responseData),
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait" as "portrait"
          },
          pagebreak: {
            mode: ["css", "legacy"]
          }
        };

        await html2pdf().set(options).from(element).save();

        if (!cancelled) {
          onDownloaded?.();
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Erro ao gerar o PDF."
          );
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingPdf(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      generatePdf();
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form, isGeneratingPdf, isLoading, loadError, onDownloaded, responseData]);

  if (isLoading) {
    return <div style={{ padding: 24 }}>Carregando resposta para gerar PDF...</div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: 24, color: "#b42318", fontWeight: 600 }}>
        {loadError}
      </div>
    );
  }

  if (!responseData) {
    return (
      <div style={{ padding: 24, color: "#667085" }}>
        Nenhuma resposta encontrada para gerar PDF.
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, color: "#475467", fontWeight: 600 }}>
        {isGeneratingPdf ? "Gerando PDF..." : "Preparando download..."}
      </div>

      <div
        ref={contentRef}
        className="print-doc"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          background: "#fff",
          color: "#101828",
          fontFamily: '"Times New Roman", Georgia, serif',
          fontSize: 13,
          lineHeight: 1.8,
          padding: 24
        }}
      >
        <header style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.3
            }}
          >
            {form.title || responseData.form_title || "Formulário"}
          </h1>

          <div style={{ marginTop: 14 }}>
            <div>
              <strong>Respondente:</strong> {respondentLabel}
            </div>
            <div>
              <strong>Data da resposta:</strong>{" "}
              {formatDateTime(responseData.submitted_at)}
            </div>
          </div>
        </header>

        {printableSections.length === 0 ? (
          <p style={{ margin: 0, color: "#667085" }}>
            Nenhuma resposta preenchida para exibir.
          </p>
        ) : (
          printableSections.map((section, sectionIndex) => (
            <section
              key={section.id}
              className="print-section"
              style={{ marginBottom: 22 }}
            >
              <h2
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 17,
                  fontWeight: 700,
                  lineHeight: 1.35
                }}
              >
                {section.title || `Seção ${sectionIndex + 1}`}
              </h2>

              <div style={{ display: "grid", gap: 10 }}>
                {section.printableQuestions.map((question) => (
                  <div key={question.id} className="print-question">
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: 4
                      }}
                    >
                      {question.label || "Pergunta sem título"}
                    </div>

                    <div style={{ whiteSpace: "pre-wrap" }}>{question.answer}</div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
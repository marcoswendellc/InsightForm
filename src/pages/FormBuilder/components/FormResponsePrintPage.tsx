import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import type { FormDefinition } from "../types";
import html2pdf from "html2pdf.js";

type Props = {
  form: FormDefinition;
  onDownloaded?: () => void;
};

type SizeValue = {
  width?: string | number | null;
  height?: string | number | null;
  unit?: string | null;
};

type ChoiceAnswerObject = {
  optionId?: string;
  optionIds?: string[];
  label?: string;
  otherText?: string;
  size?: SizeValue | null;
  unit?: string | null;
  unidade?: string | null;
  sizeUnit?: string | null;
  measureUnit?: string | null;
  unitLabel?: string | null;
};

type CheckboxAnswerObject = {
  optionId?: string;
  label?: string;
  otherText?: string;
  size?: SizeValue | null;
  unit?: string | null;
  unidade?: string | null;
  sizeUnit?: string | null;
  measureUnit?: string | null;
  unitLabel?: string | null;
};

type AnswerValue =
  | string
  | string[]
  | ChoiceAnswerObject
  | CheckboxAnswerObject[]
  | null
  | undefined;

type ResponseData = {
  id: string;
  form_id: string;
  form_title: string;
  submitted_at?: string;
  respondent_id?: string;
  respondent_name?: string;
  respondent_email?: string;
  answers?: Record<string, AnswerValue>;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTextValue(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return "";
}

function isFilledText(value: unknown) {
  return normalizeTextValue(value) !== "";
}

function extractSizeValue(value: unknown): SizeValue | null {
  if (!isPlainObject(value)) return null;

  const width = normalizeTextValue(
    value.width ?? value.largura ?? value.sizeWidth
  );

  const height = normalizeTextValue(
    value.height ?? value.altura ?? value.sizeHeight
  );

  const unit = normalizeTextValue(
    value.unit ??
      value.unidade ??
      value.sizeUnit ??
      value.measureUnit ??
      value.unitLabel
  );

  if (!width && !height && !unit) return null;

  return {
    width,
    height,
    unit
  };
}

function extractUnitFromAnswerItem(value: unknown) {
  if (!isPlainObject(value)) return "";

  return normalizeTextValue(
    value.unit ??
      value.unidade ??
      value.sizeUnit ??
      value.measureUnit ??
      value.unitLabel
  );
}

function mergeSizeWithFallbackUnit(
  size: SizeValue | null,
  fallbackUnit: string
): SizeValue | null {
  if (!size && !fallbackUnit) return null;

  return {
    width: size?.width ?? "",
    height: size?.height ?? "",
    unit: size?.unit || fallbackUnit || ""
  };
}

function formatSize(size?: SizeValue | null) {
  if (!size) return "";

  const width = normalizeTextValue(size.width);
  const height = normalizeTextValue(size.height);
  const unit = normalizeTextValue(size.unit);

  const parts: string[] = [];

  if (width) {
    parts.push(`Largura: ${width}${unit ? ` ${unit}` : ""}`);
  }

  if (height) {
    parts.push(`Altura: ${height}${unit ? ` ${unit}` : ""}`);
  }

  if (!width && !height && unit) {
    parts.push(`Unidade: ${unit}`);
  }

  return parts.join(" | ");
}

function sanitizeFileName(name: string) {
  const sanitized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || '<>:"/\\|?*'.includes(char) ? "_" : char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "formulario";
}

function getBooleanLabel(value: AnswerValue) {
  const raw = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const normalized = String(raw).trim().toLowerCase();

  if (["true", "1", "sim", "yes"].includes(normalized)) return "Sim";
  if (["false", "0", "não", "nao", "no"].includes(normalized)) return "Não";

  return String(raw || "");
}

function getOptionLabel(
  optionId: string,
  options?: Array<{
    id: string;
    label: string;
  }>
) {
  return options?.find((opt) => opt.id === optionId)?.label || "";
}

function normalizeAnswerValue(value: AnswerValue) {
  if (Array.isArray(value)) {
    if (!value.length) return "";

    if (value.every((item) => typeof item === "string")) {
      return value.join(", ");
    }

    const labels = value
      .map((item) => {
        if (!isPlainObject(item)) return "";
        return normalizeTextValue(item.label) || normalizeTextValue(item.optionId);
      })
      .filter(Boolean);

    return labels.join(", ");
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (isPlainObject(value)) {
    return (
      normalizeTextValue(value.label) ||
      normalizeTextValue(value.otherText) ||
      normalizeTextValue(value.optionId)
    );
  }

  return "";
}

function hasMeaningfulAnswer(
  questionType: string,
  value: AnswerValue,
  options?: Array<{ id: string; label: string }>
) {
  if (questionType === "checkbox") {
    if (Array.isArray(value)) {
      if (value.length === 0) return false;

      if (value.some((item) => typeof item === "string" && item.trim())) {
        return true;
      }

      if (
        value.some(
          (item) =>
            isPlainObject(item) &&
            (isFilledText(item.optionId) ||
              isFilledText(item.label) ||
              isFilledText(item.otherText) ||
              !!extractSizeValue(item.size) ||
              isFilledText(item.unit) ||
              isFilledText(item.unidade) ||
              isFilledText(item.sizeUnit) ||
              isFilledText(item.measureUnit) ||
              isFilledText(item.unitLabel))
        )
      ) {
        return true;
      }
    }

    return false;
  }

  if (questionType === "multipleChoice") {
    if (typeof value === "string") {
      if (!value.trim()) return false;
      return !!options?.some((opt) => opt.id === value);
    }

    if (isPlainObject(value)) {
      return (
        isFilledText(value.optionId) ||
        isFilledText(value.label) ||
        isFilledText(value.otherText) ||
        !!extractSizeValue(value.size) ||
        isFilledText(value.unit) ||
        isFilledText(value.unidade) ||
        isFilledText(value.sizeUnit) ||
        isFilledText(value.measureUnit) ||
        isFilledText(value.unitLabel)
      );
    }

    return false;
  }

  if (questionType === "date") {
    return typeof value === "string" && value.trim() !== "";
  }

  if (questionType === "boolean") {
    return normalizeTextValue(value) !== "";
  }

  return normalizeAnswerValue(value) !== "";
}

function formatMultipleChoiceAnswer(params: {
  value: AnswerValue;
  options?: Array<{ id: string; label: string }>;
}) {
  const { value, options } = params;

  if (typeof value === "string") {
    return getOptionLabel(value, options);
  }

  if (!isPlainObject(value)) {
    return "";
  }

  const optionId = normalizeTextValue(value.optionId);
  const optionLabel =
    normalizeTextValue(value.label) ||
    (optionId ? getOptionLabel(optionId, options) : "");
  const otherText = normalizeTextValue(value.otherText);

  const size = mergeSizeWithFallbackUnit(
    extractSizeValue(value.size),
    extractUnitFromAnswerItem(value)
  );

  const baseLabel = optionLabel || otherText || optionId;
  const sizeLabel = formatSize(size);

  if (baseLabel && sizeLabel) {
    return `${baseLabel} — ${sizeLabel}`;
  }

  return baseLabel || sizeLabel;
}

function formatCheckboxAnswer(params: {
  value: AnswerValue;
  options?: Array<{ id: string; label: string }>;
}) {
  const { value, options } = params;

  if (!Array.isArray(value) || !value.length) return "";

  if (value.every((item) => typeof item === "string")) {
    const labels = value
      .map((id) => getOptionLabel(id, options))
      .filter(Boolean);

    return labels.join(", ");
  }

  const labels = value
    .map((item) => {
      if (!isPlainObject(item)) return "";

      const optionId = normalizeTextValue(item.optionId);
      const optionLabel =
        normalizeTextValue(item.label) ||
        (optionId ? getOptionLabel(optionId, options) : "");
      const otherText = normalizeTextValue(item.otherText);

      const size = mergeSizeWithFallbackUnit(
        extractSizeValue(item.size),
        extractUnitFromAnswerItem(item)
      );

      const baseLabel = optionLabel || otherText || optionId;
      const sizeLabel = formatSize(size);

      if (baseLabel && sizeLabel) {
        return `${baseLabel} — ${sizeLabel}`;
      }

      return baseLabel || sizeLabel;
    })
    .filter(Boolean);

  return labels.join("\n");
}

function getAnswerLabel(params: {
  questionType: string;
  value: AnswerValue;
  options?: Array<{
    id: string;
    label: string;
  }>;
}) {
  const { questionType, value, options } = params;

  if (questionType === "multipleChoice") {
    return formatMultipleChoiceAnswer({ value, options });
  }

  if (questionType === "checkbox") {
    return formatCheckboxAnswer({ value, options });
  }

  if (questionType === "date") {
    return formatDateAnswer(typeof value === "string" ? value : "");
  }

  if (questionType === "boolean") {
    return getBooleanLabel(value);
  }

  return normalizeAnswerValue(value);
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

    if (!currentFormId) {
      setIsLoading(false);
      setLoadError("Formulário não informado.");
      return;
    }

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
            : "Erro ao carregar resposta para gerar PDF."
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
    if (
      isLoading ||
      loadError ||
      !responseData ||
      !contentRef.current ||
      isGeneratingPdf
    ) {
      return;
    }

    let cancelled = false;

    const waitForRender = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

    const generatePdf = async () => {
      try {
        setIsGeneratingPdf(true);

        await waitForRender();
        await document.fonts.ready;

        const element = contentRef.current;
        if (!element) return;

        const pixelRatio =
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        const options = {
          margin: [3, 3, 3, 3] as [number, number, number, number],
          filename: getPdfFileName(form, responseData),
          image: { type: "png" as const, quality: 1 },
          html2canvas: {
            scale: Math.max(3, pixelRatio * 2),
            useCORS: true,
            backgroundColor: "#ffffff",
            letterRendering: true,
            logging: false,
            allowTaint: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait" as const,
            compress: true
          },
          pagebreak: {
            mode: ["css", "legacy"] as const
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

    const timer = window.setTimeout(generatePdf, 500);

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
    <div style={{ padding: 12, background: "#f5f7fa" }}>
      <div style={{ marginBottom: 10, color: "#475467", fontWeight: 600 }}>
        {isGeneratingPdf ? "Gerando PDF..." : "Preparando download..."}
      </div>

      <div
        ref={contentRef}
        style={{
          width: "200mm",
          margin: "0 auto",
          background: "#ffffff",
          color: "#111827",
          fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
          padding: "8mm 7mm 7mm",
          boxSizing: "border-box",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact" as any
        }}
      >
        <div
          style={{
            borderBottom: "2px solid #ED1C24",
            paddingBottom: 10,
            marginBottom: 12
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#ED1C24",
              marginBottom: 6
            }}
          >
            Relatório de resposta
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 800,
              color: "#101828"
            }}
          >
            {form.title || responseData.form_title || "Formulário"}
          </h1>

          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8
            }}
          >
            <div
              style={{
                border: "1px solid #DDE3EA",
                borderRadius: 10,
                padding: "10px 12px",
                background: "#F9FAFB"
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#6B7280",
                  marginBottom: 4
                }}
              >
                Respondente
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {respondentLabel}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #DDE3EA",
                borderRadius: 10,
                padding: "10px 12px",
                background: "#F9FAFB"
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#6B7280",
                  marginBottom: 4
                }}
              >
                Data da resposta
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {formatDateTime(responseData.submitted_at)}
              </div>
            </div>
          </div>
        </div>

        {printableSections.length === 0 ? (
          <div
            style={{
              border: "1px solid #DDE3EA",
              borderRadius: 12,
              padding: 16,
              background: "#FAFAFA",
              color: "#667085",
              fontSize: 13
            }}
          >
            Nenhuma resposta preenchida para exibir.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {printableSections.map((section, sectionIndex) => (
              <section
                key={section.id}
                style={{
                  border: "1px solid #DDE3EA",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#ffffff",
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  marginBottom: 12
                }}
              >
                <div
                  style={{
                    background: "#F9FAFB",
                    borderBottom: "1px solid #DDE3EA",
                    padding: "10px 12px",
                    breakAfter: "avoid",
                    pageBreakAfter: "avoid"
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 15,
                      lineHeight: 1.3,
                      fontWeight: 800,
                      color: "#111827"
                    }}
                  >
                    {section.title || `Seção ${sectionIndex + 1}`}
                  </h2>
                </div>

                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                  {section.printableQuestions.map((question, questionIndex) => (
                    <div
                      key={question.id}
                      style={{
                        borderBottom:
                          questionIndex < section.printableQuestions.length - 1
                            ? "1px solid #E8EEF3"
                            : "none",
                        paddingBottom:
                          questionIndex < section.printableQuestions.length - 1
                            ? 10
                            : 0,
                        breakInside: "avoid",
                        pageBreakInside: "avoid"
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#344054",
                          marginBottom: 4
                        }}
                      >
                        {question.label || "Pergunta sem título"}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#111827",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {question.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            paddingTop: 10,
            borderTop: "1px solid #DDE3EA",
            fontSize: 11,
            color: "#6B7280",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <span>Documento gerado automaticamente pelo sistema.</span>
          <span>{formatDateTime(new Date().toISOString())}</span>
        </div>
      </div>
    </div>
  );
}
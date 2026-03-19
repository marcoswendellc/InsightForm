import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilePdf } from "phosphor-react";
import { useAuth } from "../../../auth/AuthContext";
import type { FormDefinition, Question } from "../types";
import SectionPreview from "./SectionPreview";
import {
  type AnswersMap,
  type ErrorsMap,
  buildSubmitAnswers,
  getNextSectionIndex,
  validateSection
} from "./formFlow";

type Props = {
  form: FormDefinition;
};

type ExistingResponsePayload = {
  id: string;
  form_id: string;
  answers?:
    | AnswersMap
    | Array<{ questionId: string; value: string | string[] }>;
};

function parseResponseAnswers(
  input: ExistingResponsePayload["answers"]
): AnswersMap {
  if (!input) return {};

  if (Array.isArray(input)) {
    return input.reduce<AnswersMap>((acc, item) => {
      if (!item?.questionId) return acc;
      acc[item.questionId] = item.value ?? "";
      return acc;
    }, {});
  }

  if (typeof input === "object") {
    return input as AnswersMap;
  }

  return {};
}

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

const uiColors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  primarySoft: "rgba(237,28,36,0.08)",
  primaryBorder: "rgba(237,28,36,0.20)",
  text: "#202124",
  textSoft: "#5f6368",
  danger: "#d93025",
  warning: "#b26a00",
  white: "#ffffff",
  cardShadow: "0 1px 3px rgba(0,0,0,0.08)"
};

export default function FormResponsePage({ form }: Props) {
  const [params] = useSearchParams();
  const { user, authHeader } = useAuth();

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [errors, setErrors] = useState<ErrorsMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [savedResponseId, setSavedResponseId] = useState("");

  const [isLoadingExistingResponse, setIsLoadingExistingResponse] =
    useState(false);
  const [loadExistingResponseError, setLoadExistingResponseError] =
    useState("");

  const responseId = params.get("responseId")?.trim() || "";
  const isEditResponse = params.get("editResponse") === "1" && !!responseId;

  const currentFormId = form.id?.trim() || "";
  const section = form.sections[currentSectionIndex];
  const canSubmitForm = Boolean(currentFormId);

  const effectiveResponseId = savedResponseId || responseId;

  const isLast = useMemo(() => {
    const next = getNextSectionIndex(form, currentSectionIndex, answers);
    return (
      next === "submit" ||
      (typeof next === "number" && next >= form.sections.length)
    );
  }, [form, currentSectionIndex, answers]);

  useEffect(() => {
    setCurrentSectionIndex(0);
    setAnswers({});
    setErrors({});
    setSubmitted(false);
    setHistory([]);
    setSubmitError("");
    setLoadExistingResponseError("");
    setIsLoadingExistingResponse(false);
    setSavedResponseId("");
  }, [form.id]);

  useEffect(() => {
    if (!currentFormId || !isEditResponse || !responseId) {
      return;
    }

    let cancelled = false;

    const loadExistingResponse = async () => {
      setIsLoadingExistingResponse(true);
      setLoadExistingResponseError("");
      setSubmitError("");

      try {
        const response = await fetch(
          `/api/forms/responses/get?formId=${encodeURIComponent(
            currentFormId
          )}&responseId=${encodeURIComponent(responseId)}`,
          {
            headers: {
              ...authHeader()
            }
          }
        );

        const data = await parseJsonResponse(response);

        if (cancelled) return;

        const mappedAnswers = parseResponseAnswers(data.response?.answers);

        setAnswers(mappedAnswers);
        setCurrentSectionIndex(0);
        setHistory([]);
        setErrors({});
        setSavedResponseId(data.response?.id ?? responseId);
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar resposta para edição.";

        setLoadExistingResponseError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingExistingResponse(false);
        }
      }
    };

    loadExistingResponse();

    return () => {
      cancelled = true;
    };
  }, [currentFormId, isEditResponse, responseId, authHeader]);

  const handleAnswerChange = (question: Question, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value
    }));

    setErrors((prev) => {
      if (!prev[question.id]) return prev;

      const next = { ...prev };
      delete next[question.id];
      return next;
    });

    if (submitError) {
      setSubmitError("");
    }
  };

  const handleBack = () => {
    setSubmitted(false);
    setErrors({});
    setSubmitError("");

    setHistory((prev) => {
      if (prev.length === 0) return prev;

      const nextHistory = [...prev];
      const previousSectionIndex = nextHistory.pop();

      if (typeof previousSectionIndex === "number") {
        setCurrentSectionIndex(previousSectionIndex);
      }

      return nextHistory;
    });
  };

  const submitForm = async () => {
    if (!canSubmitForm) {
      throw new Error("Salve o formulário antes de responder.");
    }

    if (!user?.id) {
      throw new Error("Usuário não autenticado para enviar resposta.");
    }

    const payload = {
      formId: currentFormId,
      formTitle: form.title,
      responseId: isEditResponse ? responseId : undefined,
      respondentId: user.id,
      respondentName: user.name ?? "",
      respondentEmail: user.email ?? "",
      source: "web",
      mode: isEditResponse ? "edit" : "create",
      answers: buildSubmitAnswers(answers)
    };

    const response = await fetch("/api/forms/submit", {
      method: isEditResponse ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader()
      },
      body: JSON.stringify(payload)
    });

    return parseJsonResponse(response);
  };

  const handleNext = async () => {
    if (!section) return;

    const validationErrors = validateSection(section.questions, answers);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError("");

    const next = getNextSectionIndex(form, currentSectionIndex, answers);

    const shouldSubmit =
      next === "submit" ||
      (typeof next === "number" && next >= form.sections.length);

    if (shouldSubmit) {
      try {
        setIsSubmitting(true);
        const data = await submitForm();

        const nextResponseId =
          data?.responseId || data?.id || data?.response?.id || responseId || "";

        setSavedResponseId(nextResponseId);
        setSubmitted(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao enviar formulário.";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (typeof next === "number") {
      setHistory((prev) => [...prev, currentSectionIndex]);
      setCurrentSectionIndex(next);
    }
  };

  const handleOpenPdf = () => {
    if (!currentFormId || !effectiveResponseId) {
      setSubmitError("Não foi possível localizar a resposta para gerar o PDF.");
      return;
    }

    const url =
      `/response-print?formId=${encodeURIComponent(currentFormId)}` +
      `&responseId=${encodeURIComponent(effectiveResponseId)}`;

    const iframe = document.createElement("iframe");

    iframe.src = url;
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "0";
    iframe.style.background = "#fff";

    document.body.appendChild(iframe);

    window.setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  };

  if (!section && !isLoadingExistingResponse) {
    return null;
  }

  if (isLoadingExistingResponse) {
    return (
      <div
        style={{
          background: uiColors.white,
          borderRadius: 12,
          padding: 24,
          boxShadow: uiColors.cardShadow
        }}
      >
        <h2
          style={{ margin: 0, fontSize: 24, fontWeight: 600, color: uiColors.text }}
        >
          Carregando resposta
        </h2>

        <p style={{ marginTop: 12, color: uiColors.textSoft, lineHeight: 1.5 }}>
          Aguarde enquanto buscamos os dados para edição.
        </p>
      </div>
    );
  }

  if (loadExistingResponseError) {
    return (
      <div
        style={{
          background: uiColors.white,
          borderRadius: 12,
          padding: 24,
          boxShadow: uiColors.cardShadow
        }}
      >
        <h2
          style={{ margin: 0, fontSize: 24, fontWeight: 600, color: uiColors.text }}
        >
          Não foi possível carregar a resposta
        </h2>

        <p style={{ marginTop: 12, color: uiColors.danger, lineHeight: 1.5 }}>
          {loadExistingResponseError}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          background: uiColors.white,
          borderRadius: 12,
          padding: 24,
          boxShadow: uiColors.cardShadow
        }}
      >
        <h2
          style={{ margin: 0, fontSize: 24, fontWeight: 600, color: uiColors.text }}
        >
          {isEditResponse ? "Resposta atualizada" : "Resposta enviada"}
        </h2>

        <p style={{ marginTop: 12, color: uiColors.textSoft, lineHeight: 1.5 }}>
          {isEditResponse
            ? "As alterações foram salvas com sucesso."
            : "Sua resposta foi registrada com sucesso."}
        </p>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={handleOpenPdf}
            style={{
              background: uiColors.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <FilePdf size={18} weight="bold" />
            Gerar PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isEditResponse && (
        <div
          style={{
            marginBottom: 14,
            background: uiColors.primarySoft,
            color: uiColors.primary,
            border: `1px solid ${uiColors.primaryBorder}`,
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            fontWeight: 600
          }}
        >
          Você está editando uma resposta já enviada.
        </div>
      )}

      <SectionPreview
        section={section}
        index={currentSectionIndex}
        answers={answers}
        errors={errors}
        onAnswerChange={handleAnswerChange}
      />

      {!canSubmitForm && isLast && (
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 500,
            color: uiColors.warning
          }}
        >
          Salve o formulário antes de responder.
        </div>
      )}

      {submitError && (
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 500,
            color: uiColors.danger
          }}
        >
          {submitError}
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          {history.length > 0 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              style={{
                background: "transparent",
                color: uiColors.primary,
                border: "none",
                padding: "10px 0",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Voltar
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={isSubmitting || isLoadingExistingResponse}
          style={{
            background: uiColors.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 700,
            cursor:
              isSubmitting || isLoadingExistingResponse
                ? "not-allowed"
                : "pointer",
            opacity: isSubmitting || isLoadingExistingResponse ? 0.7 : 1
          }}
        >
          {isSubmitting
            ? isEditResponse
              ? "Salvando..."
              : "Enviando..."
            : isLast
              ? isEditResponse
                ? "Salvar alterações"
                : "Enviar"
              : "Avançar"}
        </button>
      </div>
    </div>
  );
}
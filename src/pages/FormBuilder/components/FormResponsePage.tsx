import { useMemo, useState } from "react";
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

export default function FormResponsePage({ form }: Props) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [errors, setErrors] = useState<ErrorsMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const section = form.sections[currentSectionIndex];
  const canSubmitForm = Boolean(form.id?.trim());

  const isLast = useMemo(() => {
    const next = getNextSectionIndex(form, currentSectionIndex, answers);
    return next === "submit" || (typeof next === "number" && next >= form.sections.length);
  }, [form, currentSectionIndex, answers]);

  if (!section) {
    return null;
  }

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

    const payload = {
      formId: form.id,
      formTitle: form.title,
      source: "web",
      answers: buildSubmitAnswers(answers)
    };

    const response = await fetch("/api/forms/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();

    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      throw new Error(rawText || "Resposta inválida ao enviar formulário.");
    }

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Não foi possível enviar a resposta.");
    }
  };

  const handleNext = async () => {
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
        await submitForm();
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

    setHistory((prev) => [...prev, currentSectionIndex]);
    setCurrentSectionIndex(next);
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: "#202124" }}>
          Resposta enviada
        </h2>

        <p style={{ marginTop: 12, color: "#5f6368", lineHeight: 1.5 }}>
          Sua resposta foi registrada com sucesso.
        </p>

        <button
          onClick={() => {
            setSubmitted(false);
            setCurrentSectionIndex(0);
            setAnswers({});
            setErrors({});
            setHistory([]);
            setSubmitError("");
          }}
          style={{
            marginTop: 20,
            background: "#673ab7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Responder novamente
        </button>
      </div>
    );
  }

  return (
    <div>
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
            color: "#b26a00"
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
            color: "#d93025"
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
                color: "#673ab7",
                border: "none",
                padding: "10px 0",
                fontWeight: 600,
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
          disabled={isSubmitting}
          style={{
            background: "#673ab7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? "Enviando..." : isLast ? "Enviar" : "Avançar"}
        </button>
      </div>
    </div>
  );
}
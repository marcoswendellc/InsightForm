import { useMemo, useState } from "react";
import type { FormDefinition, GoTo, Question } from "../types";
import SectionPreview from "./SectionPreview";

type AnswersMap = Record<string, string | string[]>;

type Props = {
  form: FormDefinition;
};

function getNextSectionIndex(
  form: FormDefinition,
  currentSectionIndex: number,
  answers: AnswersMap
) {
  const currentSection = form.sections[currentSectionIndex];
  if (!currentSection) return currentSectionIndex + 1;

  for (const question of currentSection.questions) {
    if (question.type !== "multipleChoice" || !question.jumpEnabled) continue;

    const answer = answers[question.id];
    if (!answer || Array.isArray(answer)) continue;

    const selectedOption = question.options?.find((opt) => opt.id === answer);
    if (!selectedOption?.goTo) continue;

    const goTo = selectedOption.goTo;

    if (goTo.kind === "submit") {
      return "submit";
    }

    if (goTo.kind === "section") {
      const targetIndex = form.sections.findIndex((s) => s.id === goTo.sectionId);
      if (targetIndex !== -1) return targetIndex;
    }

    if (goTo.kind === "next") {
      return currentSectionIndex + 1;
    }
  }

  return currentSectionIndex + 1;
}

export default function FormPreview({ form }: Props) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [submitted, setSubmitted] = useState(false);

  const section = form.sections[currentSectionIndex];

  const isLast = useMemo(() => {
    const next = getNextSectionIndex(form, currentSectionIndex, answers);
    return next === "submit" || currentSectionIndex >= form.sections.length - 1;
  }, [form, currentSectionIndex, answers]);

  if (!section) {
    return null;
  }

  const handleAnswerChange = (question: Question, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value
    }));
  };

  const handleBack = () => {
    setSubmitted(false);
    setCurrentSectionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    const next = getNextSectionIndex(form, currentSectionIndex, answers);

    if (next === "submit") {
      setSubmitted(true);
      return;
    }

    if (next >= form.sections.length) {
      setSubmitted(true);
      return;
    }

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
          Este é apenas um preview do formulário.
        </p>

        <button
          onClick={() => {
            setSubmitted(false);
            setCurrentSectionIndex(0);
            setAnswers({});
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
        onAnswerChange={handleAnswerChange}
      />

      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          {currentSectionIndex > 0 && (
            <button
              onClick={handleBack}
              style={{
                background: "transparent",
                color: "#673ab7",
                border: "none",
                padding: "10px 0",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Voltar
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          style={{
            background: "#673ab7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {isLast ? "Enviar" : "Avançar"}
        </button>
      </div>
    </div>
  );
}
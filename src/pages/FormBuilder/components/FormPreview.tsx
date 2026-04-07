import { useMemo, useState } from "react";
import type { FormDefinition, Question, FormAnswerValue } from "../types";
import SectionPreview from "./SectionPreview";
import type { QuestionAnswerValue } from "./QuestionPreview";
import {
  type AnswersMap,
  type ErrorsMap,
  getNextSectionIndex,
  validateSection
} from "./formFlow";

type Props = {
  form: FormDefinition;
};

export default function FormPreview({ form }: Props) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [errors, setErrors] = useState<ErrorsMap>({});
  const [history, setHistory] = useState<number[]>([]);

  const section = form.sections[currentSectionIndex];

  const isLast = useMemo(() => {
    const next = getNextSectionIndex(form, currentSectionIndex, answers);
    return (
      next === "submit" ||
      (typeof next === "number" && next >= form.sections.length)
    );
  }, [form, currentSectionIndex, answers]);

  if (!section) {
    return null;
  }

  const handleAnswerChange = (
    question: Question,
    value: QuestionAnswerValue
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value as FormAnswerValue
    }));

    setErrors((prev) => {
      if (!prev[question.id]) return prev;
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
  };

  const handleBack = () => {
    setErrors({});

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

  const handleNext = () => {
    const validationErrors = validateSection(section.questions, answers);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const next = getNextSectionIndex(form, currentSectionIndex, answers);

    const shouldFinish =
      next === "submit" ||
      (typeof next === "number" && next >= form.sections.length);

    if (shouldFinish) {
      return;
    }

    setHistory((prev) => [...prev, currentSectionIndex]);
    setCurrentSectionIndex(next);
  };

  return (
    <div>
      <SectionPreview
        section={section}
        index={currentSectionIndex}
        answers={answers}
        errors={errors}
        onAnswerChange={handleAnswerChange}
      />

      <div
        style={{
          marginTop: 14,
          fontSize: 13,
          color: "rgba(0,0,0,0.6)"
        }}
      >
        Pré-visualização do fluxo. As respostas não serão enviadas nesta tela.
      </div>

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
            cursor: "pointer",
            opacity: isLast ? 0.7 : 1
          }}
        >
          {isLast ? "Fim do fluxo" : "Avançar"}
        </button>
      </div>
    </div>
  );
}
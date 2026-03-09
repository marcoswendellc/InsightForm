import type { FormDefinition, GoTo, Question } from "../types";

export type AnswersMap = Record<string, string | string[]>;
export type ErrorsMap = Record<string, string>;

export type SubmitAnswer = {
  questionId: string;
  value: string | string[];
};

export function resolveGoToTarget(
  form: FormDefinition,
  currentSectionIndex: number,
  goTo?: GoTo
): number | "submit" {
  if (!goTo || goTo.kind === "next") {
    return currentSectionIndex + 1;
  }

  if (goTo.kind === "submit") {
    return "submit";
  }

  if (goTo.kind === "section") {
    const targetIndex = form.sections.findIndex((section) => section.id === goTo.sectionId);
    return targetIndex !== -1 ? targetIndex : currentSectionIndex + 1;
  }

  return currentSectionIndex + 1;
}

export function getNextSectionIndex(
  form: FormDefinition,
  currentSectionIndex: number,
  answers: AnswersMap
): number | "submit" {
  const currentSection = form.sections[currentSectionIndex];
  if (!currentSection) return currentSectionIndex + 1;

  for (const question of currentSection.questions) {
    if (question.type !== "multipleChoice" || !question.jumpEnabled) continue;

    const answer = answers[question.id];
    if (!answer || Array.isArray(answer)) continue;

    const selectedOption = question.options?.find((option) => option.id === answer);
    if (selectedOption?.goTo) {
      return resolveGoToTarget(form, currentSectionIndex, selectedOption.goTo);
    }
  }

  if (currentSection.goTo) {
    return resolveGoToTarget(form, currentSectionIndex, currentSection.goTo);
  }

  return currentSectionIndex + 1;
}

export function isEmptyAnswer(
  question: Question,
  value: string | string[] | undefined
) {
  if (question.type === "checkbox") {
    return !Array.isArray(value) || value.length === 0;
  }

  return typeof value !== "string" || value.trim() === "";
}

export function validateSection(
  sectionQuestions: Question[],
  answers: AnswersMap
): ErrorsMap {
  const nextErrors: ErrorsMap = {};

  for (const question of sectionQuestions) {
    if (!question.required) continue;

    const value = answers[question.id];

    if (isEmptyAnswer(question, value)) {
      nextErrors[question.id] = "Esta pergunta é obrigatória.";
    }
  }

  return nextErrors;
}

export function buildSubmitAnswers(answers: AnswersMap): SubmitAnswer[] {
  return Object.entries(answers)
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value.trim() !== "";
    })
    .map(([questionId, value]) => ({
      questionId,
      value
    }));
}
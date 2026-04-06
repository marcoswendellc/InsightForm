import type {
  FormDefinition,
  GoTo,
  Question,
  FormAnswerValue,
  MultipleChoiceAnswer,
  CheckboxAnswer,
  SizeValue
} from "../types";

export type AnswersMap = Record<string, FormAnswerValue>;
export type ErrorsMap = Record<string, string>;

export type SubmitAnswer = {
  questionId: string;
  value: FormAnswerValue;
};

function isValidDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function isBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() === "";
}

function isMultipleChoiceAnswerObject(
  value: FormAnswerValue | undefined
): value is Exclude<MultipleChoiceAnswer, string> {
  return !!value && typeof value === "object" && !Array.isArray(value) && "optionId" in value;
}

function isCheckboxAnswerObject(
  value: FormAnswerValue | undefined
): value is Exclude<CheckboxAnswer, string[]> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "selectedOptionIds" in value
  );
}

function hasFilledSize(size?: SizeValue) {
  return !!size?.height?.trim() && !!size?.width?.trim() && !!size?.unit?.trim();
}

function isEmptyCheckboxAnswer(value: FormAnswerValue | undefined) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isCheckboxAnswerObject(value)) {
    return !Array.isArray(value.selectedOptionIds) || value.selectedOptionIds.length === 0;
  }

  return true;
}

function isEmptyTextLikeAnswer(value: FormAnswerValue | undefined) {
  return typeof value !== "string" || value.trim() === "";
}

function isMissingRequiredDateAnswer(
  question: Question,
  value: FormAnswerValue | undefined
) {
  if (typeof value !== "string" || value.trim() === "") {
    return true;
  }

  const normalizedValue = value.trim();

  if (question.includeTime === true) {
    return !isValidDateTime(normalizedValue);
  }

  return !isValidDateOnly(normalizedValue);
}

function isMissingRequiredMultipleChoiceAnswer(
  question: Question,
  value: FormAnswerValue | undefined
) {
  if (!question.sizeEnabled) {
    return typeof value !== "string" || value.trim() === "";
  }

  if (!isMultipleChoiceAnswerObject(value)) {
    return true;
  }

  if (!value.optionId?.trim()) {
    return true;
  }

  return !hasFilledSize(value.size);
}

function isMissingRequiredCheckboxSizeAnswer(value: FormAnswerValue | undefined) {
  if (!isCheckboxAnswerObject(value)) {
    return true;
  }

  const selectedIds = value.selectedOptionIds ?? [];
  if (selectedIds.length === 0) {
    return true;
  }

  return selectedIds.some((optionId) => !hasFilledSize(value.sizes?.[optionId]));
}

function getRequiredErrorMessage(question: Question) {
  if (question.type === "date" && question.includeTime === true) {
    return "Preencha a data e a hora.";
  }

  if (
    question.type === "multipleChoice" &&
    question.sizeEnabled
  ) {
    return "Selecione uma opção e preencha altura, largura e unidade.";
  }

  if (
    question.type === "checkbox" &&
    question.sizeEnabled
  ) {
    return "Selecione ao menos uma opção e preencha altura, largura e unidade.";
  }

  return "Esta pergunta é obrigatória.";
}

function getSelectedMultipleChoiceOptionId(value: FormAnswerValue | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (isMultipleChoiceAnswerObject(value)) {
    return value.optionId;
  }

  return "";
}

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
    const targetIndex = form.sections.findIndex(
      (section) => section.id === goTo.sectionId
    );

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
    const selectedOptionId = getSelectedMultipleChoiceOptionId(answer);

    if (!selectedOptionId) continue;

    const selectedOption = question.options?.find(
      (option) => option.id === selectedOptionId
    );

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
  value: FormAnswerValue | undefined
) {
  if (question.type === "checkbox") {
    if (question.sizeEnabled) {
      return isMissingRequiredCheckboxSizeAnswer(value);
    }

    return isEmptyCheckboxAnswer(value);
  }

  if (question.type === "multipleChoice") {
    return isMissingRequiredMultipleChoiceAnswer(question, value);
  }

  if (question.type === "date") {
    return isMissingRequiredDateAnswer(question, value);
  }

  return isEmptyTextLikeAnswer(value);
}

export function validateSection(
  sectionQuestions: Question[],
  answers: AnswersMap
): ErrorsMap {
  const nextErrors: ErrorsMap = {};

  for (const question of sectionQuestions) {
    if (!question.required) continue;

    const value = answers[question.id];
    const hasEmptyAnswer = isEmptyAnswer(question, value);

    if (hasEmptyAnswer) {
      nextErrors[question.id] = getRequiredErrorMessage(question);
    }
  }

  return nextErrors;
}

export function buildSubmitAnswers(answers: AnswersMap): SubmitAnswer[] {
  return Object.entries(answers)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "string") {
        return !isBlankString(value);
      }

      if (isMultipleChoiceAnswerObject(value)) {
        return !!value.optionId?.trim();
      }

      if (isCheckboxAnswerObject(value)) {
        return Array.isArray(value.selectedOptionIds) && value.selectedOptionIds.length > 0;
      }

      return false;
    })
    .map(([questionId, value]) => ({
      questionId,
      value
    }));
}
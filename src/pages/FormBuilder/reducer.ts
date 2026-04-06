import type {
  FormDefinition,
  Mode,
  QuestionType,
  Question,
  Option,
  GoTo
} from "./types";
import {
  createEmptyForm,
  createId,
  createQuestion,
  createOption
} from "./types";

type MoveDirection = "up" | "down";

export type State = {
  mode: Mode;
  activeSectionId: string | null;
  form: FormDefinition;
};

export type Action =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "RESET_FORM" }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_ACTIVE_SECTION"; sectionId: string | null }
  | { type: "ADD_SECTION" }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "MOVE_SECTION"; sectionId: string; direction: MoveDirection }
  | {
      type: "UPDATE_SECTION";
      sectionId: string;
      data: Partial<{ title: string; description: string }>;
    }
  | { type: "UPDATE_SECTION_GOTO"; sectionId: string; goTo: GoTo }
  | { type: "ADD_QUESTION"; sectionId: string; qType: QuestionType }
  | { type: "REMOVE_QUESTION"; sectionId: string; questionId: string }
  | {
      type: "MOVE_QUESTION";
      sectionId: string;
      questionId: string;
      direction: MoveDirection;
    }
  | {
      type: "UPDATE_QUESTION";
      sectionId: string;
      questionId: string;
      data: Partial<{
        label: string;
        required: boolean;
        type: QuestionType;
        jumpEnabled: boolean;
        includeTime: boolean;
        sizeEnabled: boolean;
      }>;
    }
  | { type: "ADD_OPTION"; sectionId: string; questionId: string }
  | { type: "ADD_OTHER_OPTION"; sectionId: string; questionId: string }
  | {
      type: "UPDATE_OPTION";
      sectionId: string;
      questionId: string;
      index: number;
      value: string;
    }
  | {
      type: "UPDATE_OPTION_GOTO";
      sectionId: string;
      questionId: string;
      index: number;
      goTo: GoTo;
    }
  | {
      type: "REMOVE_OPTION";
      sectionId: string;
      questionId: string;
      index: number;
    }
  | { type: "IMPORT_FORM"; form: FormDefinition };

export const initialState = (seed?: FormDefinition): State => {
  const form = seed ?? createEmptyForm();

  return {
    mode: "builder",
    activeSectionId: form.sections[0]?.id ?? null,
    form
  };
};

function isOptionsType(type: QuestionType) {
  return type === "multipleChoice" || type === "checkbox";
}

function ensureOtherLast(options: Option[]) {
  const other = options.find((o) => o.isOther);
  const normals = options.filter((o) => !o.isOther);
  return other ? [...normals, other] : normals;
}

function hasOther(options?: Option[]) {
  return !!options?.some((o) => o.isOther);
}

function clearOptionGoTo(options?: Option[]) {
  if (!options) return options;
  return options.map((o) => (o.goTo ? { ...o, goTo: undefined } : o));
}

function getFirstSectionId(form: FormDefinition) {
  return form.sections[0]?.id ?? null;
}

function moveItem<T>(list: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function normalizeQuestionOnTypeChange(
  question: Question,
  nextType: QuestionType
): Question {
  if (question.type === nextType) return question;

  if (isOptionsType(nextType)) {
    const nextOptions =
      question.options?.length ? question.options : [createOption("Opção 1")];

    return {
      ...question,
      type: nextType,
      options: ensureOtherLast(nextOptions),
      jumpEnabled:
        nextType === "multipleChoice" ? question.jumpEnabled ?? false : undefined,
      includeTime: undefined,
      sizeEnabled: false
    };
  }

  if (nextType === "date") {
    return {
      ...question,
      type: nextType,
      options: undefined,
      jumpEnabled: undefined,
      includeTime: question.includeTime ?? false,
      sizeEnabled: undefined
    };
  }

  return {
    ...question,
    type: nextType,
    options: undefined,
    jumpEnabled: undefined,
    includeTime: undefined,
    sizeEnabled: undefined
  };
}

function mapSections(
  state: State,
  updater: (
    section: FormDefinition["sections"][number]
  ) => FormDefinition["sections"][number]
): State {
  return {
    ...state,
    form: {
      ...state.form,
      sections: state.form.sections.map(updater)
    }
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "RESET_FORM": {
      const form = createEmptyForm();
      return {
        mode: "builder",
        activeSectionId: getFirstSectionId(form),
        form
      };
    }

    case "SET_TITLE":
      return {
        ...state,
        form: { ...state.form, title: action.title }
      };

    case "SET_ACTIVE_SECTION":
      return { ...state, activeSectionId: action.sectionId };

    case "ADD_SECTION": {
      const id = createId();

      return {
        ...state,
        activeSectionId: id,
        form: {
          ...state.form,
          sections: [
            ...state.form.sections,
            {
              id,
              title: `Seção ${state.form.sections.length + 1}`,
              description: "",
              questions: [],
              goTo: { kind: "next" }
            }
          ]
        }
      };
    }

    case "REMOVE_SECTION": {
      if (state.form.sections.length <= 1) return state;

      const nextSections = state.form.sections.filter(
        (section) => section.id !== action.sectionId
      );

      return {
        ...state,
        activeSectionId:
          state.activeSectionId === action.sectionId
            ? nextSections[0]?.id ?? null
            : state.activeSectionId,
        form: { ...state.form, sections: nextSections }
      };
    }

    case "MOVE_SECTION": {
      const index = state.form.sections.findIndex(
        (section) => section.id === action.sectionId
      );

      if (index < 0) return state;

      const newIndex = action.direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= state.form.sections.length) {
        return state;
      }

      return {
        ...state,
        form: {
          ...state.form,
          sections: moveItem(state.form.sections, index, newIndex)
        }
      };
    }

    case "UPDATE_SECTION":
      return mapSections(state, (section) =>
        section.id === action.sectionId
          ? { ...section, ...action.data }
          : section
      );

    case "UPDATE_SECTION_GOTO":
      return mapSections(state, (section) =>
        section.id === action.sectionId
          ? { ...section, goTo: action.goTo }
          : section
      );

    case "ADD_QUESTION":
      return mapSections(state, (section) =>
        section.id === action.sectionId
          ? {
              ...section,
              questions: [...section.questions, createQuestion(action.qType)]
            }
          : section
      );

    case "REMOVE_QUESTION":
      return mapSections(state, (section) =>
        section.id === action.sectionId
          ? {
              ...section,
              questions: section.questions.filter(
                (question) => question.id !== action.questionId
              )
            }
          : section
      );

    case "MOVE_QUESTION":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        const index = section.questions.findIndex(
          (question) => question.id === action.questionId
        );

        if (index < 0) return section;

        const newIndex = action.direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= section.questions.length) {
          return section;
        }

        return {
          ...section,
          questions: moveItem(section.questions, index, newIndex)
        };
      });

    case "UPDATE_QUESTION":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) => {
            if (question.id !== action.questionId) return question;

            let nextQuestion = question;

            if (action.data.type) {
              nextQuestion = normalizeQuestionOnTypeChange(
                nextQuestion,
                action.data.type
              );
            }

            if (typeof action.data.jumpEnabled === "boolean") {
              const enabling = action.data.jumpEnabled;

              if (nextQuestion.type === "multipleChoice") {
                nextQuestion = {
                  ...nextQuestion,
                  jumpEnabled: enabling,
                  options: enabling
                    ? nextQuestion.options
                    : clearOptionGoTo(nextQuestion.options)
                };
              } else {
                nextQuestion = {
                  ...nextQuestion,
                  jumpEnabled: false,
                  options: clearOptionGoTo(nextQuestion.options)
                };
              }
            }

            if (typeof action.data.includeTime === "boolean") {
              nextQuestion = {
                ...nextQuestion,
                includeTime:
                  nextQuestion.type === "date"
                    ? action.data.includeTime
                    : undefined
              };
            }

            const {
              type,
              jumpEnabled,
              includeTime,
              ...rest
            } = action.data as Partial<{
              label: string;
              required: boolean;
              type: QuestionType;
              jumpEnabled: boolean;
              includeTime: boolean;
              sizeEnabled: boolean;
            }>;

            return {
              ...nextQuestion,
              ...rest
            };
          })
        };
      });

    case "ADD_OPTION":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) => {
            if (question.id !== action.questionId) return question;
            if (!question.options) return question;

            const base = question.options.filter((option) => !option.isOther);
            const other = question.options.find((option) => option.isOther);

            return {
              ...question,
              options: [
                ...base,
                createOption(`Opção ${base.length + 1}`),
                ...(other ? [other] : [])
              ]
            };
          })
        };
      });

    case "ADD_OTHER_OPTION":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) => {
            if (question.id !== action.questionId) return question;
            if (!question.options) return question;
            if (hasOther(question.options)) return question;

            return {
              ...question,
              options: ensureOtherLast([
                ...question.options,
                createOption("Outros", { isOther: true })
              ])
            };
          })
        };
      });

    case "UPDATE_OPTION":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) => {
            if (question.id !== action.questionId) return question;
            if (!question.options) return question;

            return {
              ...question,
              options: ensureOtherLast(
                question.options.map((option, index) =>
                  index === action.index
                    ? { ...option, label: action.value }
                    : option
                )
              )
            };
          })
        };
      });

    case "UPDATE_OPTION_GOTO":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) => {
            if (question.id !== action.questionId) return question;
            if (!question.options) return question;
            if (!question.jumpEnabled) return question;

            return {
              ...question,
              options: ensureOtherLast(
                question.options.map((option, index) =>
                  index === action.index
                    ? { ...option, goTo: action.goTo }
                    : option
                )
              )
            };
          })
        };
      });

    case "REMOVE_OPTION":
      return mapSections(state, (section) => {
        if (section.id !== action.sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) => {
            if (question.id !== action.questionId) return question;
            if (!question.options) return question;

            const filtered = question.options.filter(
              (_, index) => index !== action.index
            );

            if (filtered.length === 0) {
              return {
                ...question,
                options: [createOption("Opção 1")]
              };
            }

            return {
              ...question,
              options: ensureOtherLast(filtered)
            };
          })
        };
      });

    case "IMPORT_FORM":
      return {
        mode: "builder",
        activeSectionId: getFirstSectionId(action.form),
        form: action.form
      };

    default:
      return state;
  }
}
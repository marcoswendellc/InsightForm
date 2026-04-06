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
        sizeEnabled: boolean; // 🔥 NOVO
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
      sizeEnabled: false // 🔥 reset ao trocar tipo
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
  updater: (section: FormDefinition["sections"][number]) => FormDefinition["sections"][number]
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

    case "UPDATE_SECTION":
      return mapSections(state, (section) =>
        section.id === action.sectionId
          ? { ...section, ...action.data }
          : section
      );

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

            return {
              ...nextQuestion,
              ...action.data
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
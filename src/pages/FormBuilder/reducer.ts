import type { FormDefinition, Mode, QuestionType, Question, Option, GoTo } from "./types";
import { createEmptyForm, createId, createQuestion, createOption } from "./types";

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
  | { type: "UPDATE_SECTION"; sectionId: string; data: Partial<{ title: string; description: string }> }
  | { type: "ADD_QUESTION"; sectionId: string; qType: QuestionType }
  | { type: "REMOVE_QUESTION"; sectionId: string; questionId: string }
  | {
      type: "UPDATE_QUESTION";
      sectionId: string;
      questionId: string;
      data: Partial<{ label: string; required: boolean; type: QuestionType; jumpEnabled: boolean }>;
    }
  | { type: "ADD_OPTION"; sectionId: string; questionId: string }
  | { type: "ADD_OTHER_OPTION"; sectionId: string; questionId: string }
  | { type: "UPDATE_OPTION"; sectionId: string; questionId: string; index: number; value: string }
  | { type: "UPDATE_OPTION_GOTO"; sectionId: string; questionId: string; index: number; goTo: GoTo }
  | { type: "REMOVE_OPTION"; sectionId: string; questionId: string; index: number }
  | { type: "IMPORT_FORM"; form: FormDefinition };

export const initialState = (seed?: FormDefinition): State => {
  const form = seed ?? createEmptyForm();
  return {
    mode: "builder",
    activeSectionId: form.sections[0]?.id ?? null,
    form
  };
};

function isOptionsType(t: QuestionType) {
  return t === "multipleChoice" || t === "checkbox";
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

function normalizeQuestionOnTypeChange(q: Question, nextType: QuestionType): Question {
  if (q.type === nextType) return q;

  if (isOptionsType(nextType)) {
    const nextOptions = q.options?.length ? q.options : [createOption("Opção 1")];

    return {
      ...q,
      type: nextType,
      options: ensureOtherLast(nextOptions),
      jumpEnabled: nextType === "multipleChoice" ? q.jumpEnabled ?? false : undefined
    };
  }

  return {
    ...q,
    type: nextType,
    options: undefined,
    jumpEnabled: undefined
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "RESET_FORM": {
      const form = createEmptyForm();
      return { mode: "builder", activeSectionId: form.sections[0]?.id ?? null, form };
    }

    case "SET_TITLE":
      return { ...state, form: { ...state.form, title: action.title } };

    case "SET_ACTIVE_SECTION":
      return { ...state, activeSectionId: action.sectionId };

    case "ADD_SECTION": {
      const id = createId();

      const nextSections = [
        ...state.form.sections,
        {
          id,
          title: `Seção ${state.form.sections.length + 1}`,
          description: "",
          questions: []
        }
      ];

      return {
        ...state,
        activeSectionId: id,
        form: { ...state.form, sections: nextSections }
      };
    }

    case "REMOVE_SECTION": {
      const nextSections = state.form.sections.filter((s) => s.id !== action.sectionId);
      const nextActive = nextSections[0]?.id ?? null;

      return {
        ...state,
        activeSectionId: nextActive,
        form: { ...state.form, sections: nextSections }
      };
    }

    case "UPDATE_SECTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId ? { ...s, ...action.data } : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "ADD_QUESTION": {
      const q = createQuestion(action.qType);

      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? { ...s, questions: [...s.questions, q] }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "REMOVE_QUESTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== action.questionId) }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "UPDATE_QUESTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== action.questionId) return q;

                let nextQ: Question = q;

                if (action.data.type) {
                  nextQ = normalizeQuestionOnTypeChange(nextQ, action.data.type);
                }

                if (typeof action.data.jumpEnabled === "boolean") {
                  const enabling = action.data.jumpEnabled;

                  if (nextQ.type === "multipleChoice") {
                    nextQ = {
                      ...nextQ,
                      jumpEnabled: enabling,
                      options: enabling ? nextQ.options : clearOptionGoTo(nextQ.options)
                    };
                  } else {
                    nextQ = {
                      ...nextQ,
                      jumpEnabled: false,
                      options: clearOptionGoTo(nextQ.options)
                    };
                  }
                }

                const { type, jumpEnabled, ...rest } = action.data as any;

                return { ...nextQ, ...rest };
              })
            }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "ADD_OPTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== action.questionId) return q;
                if (!q.options) return q;

                const base = q.options.filter((o) => !o.isOther);
                const other = q.options.find((o) => o.isOther);

                const next = [
                  ...base,
                  createOption(`Opção ${base.length + 1}`),
                  ...(other ? [other] : [])
                ];

                return { ...q, options: next };
              })
            }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "ADD_OTHER_OPTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== action.questionId) return q;
                if (!q.options) return q;
                if (hasOther(q.options)) return q;

                const next = ensureOtherLast([
                  ...q.options,
                  createOption("Outros", { isOther: true })
                ]);

                return { ...q, options: next };
              })
            }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "UPDATE_OPTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== action.questionId) return q;
                if (!q.options) return q;

                const options = q.options.map((opt, i) =>
                  i === action.index ? { ...opt, label: action.value } : opt
                );

                return { ...q, options: ensureOtherLast(options) };
              })
            }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "UPDATE_OPTION_GOTO": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== action.questionId) return q;
                if (!q.options) return q;
                if (!q.jumpEnabled) return q;

                const options = q.options.map((opt, i) =>
                  i === action.index ? { ...opt, goTo: action.goTo } : opt
                );

                return { ...q, options: ensureOtherLast(options) };
              })
            }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "REMOVE_OPTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== action.questionId) return q;
                if (!q.options) return q;

                const options = q.options.filter((_, i) => i !== action.index);

                const other = options.find((o) => o.isOther);
                const normals = options.filter((o) => !o.isOther);

                const ensuredNormals =
                  normals.length ? normals : [createOption("Opção 1")];

                return {
                  ...q,
                  options: ensureOtherLast([
                    ...ensuredNormals,
                    ...(other ? [other] : [])
                  ])
                };
              })
            }
          : s
      );

      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "IMPORT_FORM":
      return {
        mode: "builder",
        activeSectionId: action.form.sections[0]?.id ?? null,
        form: action.form
      };

    default:
      return state;
  }
}
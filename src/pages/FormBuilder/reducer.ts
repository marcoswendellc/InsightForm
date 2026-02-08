import type { FormDefinition, Mode, QuestionType } from "./types";
import { createEmptyForm, createId, createQuestion } from "./types";

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
  | { type: "UPDATE_QUESTION"; sectionId: string; questionId: string; data: Partial<{ label: string; required: boolean }> }
  | { type: "ADD_OPTION"; sectionId: string; questionId: string }
  | { type: "UPDATE_OPTION"; sectionId: string; questionId: string; index: number; value: string }
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
      return { ...state, activeSectionId: id, form: { ...state.form, sections: nextSections } };
    }

    case "REMOVE_SECTION": {
      const nextSections = state.form.sections.filter((s) => s.id !== action.sectionId);
      const nextActive = nextSections[0]?.id ?? null;
      return { ...state, activeSectionId: nextActive, form: { ...state.form, sections: nextSections } };
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
        s.id === action.sectionId ? { ...s, questions: [...s.questions, q] } : s
      );
      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "REMOVE_QUESTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId ? { ...s, questions: s.questions.filter((q) => q.id !== action.questionId) } : s
      );
      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "UPDATE_QUESTION": {
      const nextSections = state.form.sections.map((s) =>
        s.id === action.sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === action.questionId ? { ...q, ...action.data } : q
              )
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
                return { ...q, options: [...q.options, `Opção ${q.options.length + 1}`] };
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
                const options = q.options.map((opt, i) => (i === action.index ? action.value : opt));
                return { ...q, options };
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
                return { ...q, options: options.length ? options : ["Opção 1"] };
              })
            }
          : s
      );
      return { ...state, form: { ...state.form, sections: nextSections } };
    }

    case "IMPORT_FORM":
      return { mode: "builder", activeSectionId: action.form.sections[0]?.id ?? null, form: action.form };

    default:
      return state;
  }
}

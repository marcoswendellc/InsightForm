import { useEffect, useMemo, useReducer } from "react";
import type { FormDefinition, Mode, QuestionType, GoTo } from "./types";
import { createEmptyForm } from "./types";
import { initialState, reducer } from "./reducer";

const STORAGE_KEY = "insight_form_builder_v1";

function loadDraft(): FormDefinition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FormDefinition;
  } catch {
    return null;
  }
}

function saveDraft(form: FormDefinition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // ignore
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useFormBuilder() {
  const seed = useMemo(() => loadDraft(), []);
  const [state, dispatch] = useReducer(reducer, initialState(seed ?? undefined));

  useEffect(() => {
    saveDraft(state.form);
  }, [state.form]);

  const actions = useMemo(() => {
    return {
      setMode: (mode: Mode) => dispatch({ type: "SET_MODE", mode }),

      reset: (opts?: { hard?: boolean }) => {
        const hard = !!opts?.hard;

        if (hard) {
          clearDraft();
          dispatch({ type: "IMPORT_FORM", form: createEmptyForm() });
          dispatch({ type: "SET_ACTIVE_SECTION", sectionId: null });
          dispatch({ type: "SET_MODE", mode: "builder" });
          return;
        }

        dispatch({ type: "RESET_FORM" });
      },

      setTitle: (title: string) => dispatch({ type: "SET_TITLE", title }),

      setActiveSection: (sectionId: string | null) =>
        dispatch({ type: "SET_ACTIVE_SECTION", sectionId }),

      addSection: () => dispatch({ type: "ADD_SECTION" }),
      removeSection: (sectionId: string) =>
        dispatch({ type: "REMOVE_SECTION", sectionId }),
      updateSection: (
        sectionId: string,
        data: Partial<{ title: string; description: string }>
      ) => dispatch({ type: "UPDATE_SECTION", sectionId, data }),

      addQuestion: (sectionId: string, qType: QuestionType) =>
        dispatch({ type: "ADD_QUESTION", sectionId, qType }),
      removeQuestion: (sectionId: string, questionId: string) =>
        dispatch({ type: "REMOVE_QUESTION", sectionId, questionId }),

      updateQuestion: (
        sectionId: string,
        questionId: string,
        data: Partial<{ label: string; required: boolean; type: QuestionType }>
      ) => dispatch({ type: "UPDATE_QUESTION", sectionId, questionId, data }),

      addOption: (sectionId: string, questionId: string) =>
        dispatch({ type: "ADD_OPTION", sectionId, questionId }),

      // ✅ NOVO: adiciona “Outros” uma única vez e sempre no final
      addOtherOption: (sectionId: string, questionId: string) =>
        dispatch({ type: "ADD_OTHER_OPTION", sectionId, questionId }),

      updateOption: (
        sectionId: string,
        questionId: string,
        index: number,
        value: string
      ) => dispatch({ type: "UPDATE_OPTION", sectionId, questionId, index, value }),

      // ✅ NOVO: define o pulo de seção por opção
      updateOptionGoTo: (
        sectionId: string,
        questionId: string,
        index: number,
        goTo: GoTo
      ) => dispatch({ type: "UPDATE_OPTION_GOTO", sectionId, questionId, index, goTo }),

      removeOption: (sectionId: string, questionId: string, index: number) =>
        dispatch({ type: "REMOVE_OPTION", sectionId, questionId, index }),

      importEmpty: () => {
        clearDraft();
        dispatch({ type: "IMPORT_FORM", form: createEmptyForm() });
      },

      importForm: (form: FormDefinition) => dispatch({ type: "IMPORT_FORM", form })
    };
  }, []);

  const activeSection = useMemo(() => {
    return state.form.sections.find((s) => s.id === state.activeSectionId) ?? null;
  }, [state.form.sections, state.activeSectionId]);

  return { state, actions, activeSection };
}
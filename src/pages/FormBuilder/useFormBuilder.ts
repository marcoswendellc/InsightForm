import { useEffect, useMemo, useReducer } from "react";
import type {
  FormDefinition,
  Mode,
  QuestionType,
  GoTo
} from "./types";
import { createEmptyForm } from "./types";
import { initialState, reducer } from "./reducer";

export const STORAGE_KEY = "insight_form_builder_v1";

type QuestionUpdateData = Partial<{
  label: string;
  required: boolean;
  type: QuestionType;
  jumpEnabled: boolean;
  includeTime: boolean;
}>;

type SectionUpdateData = Partial<{
  title: string;
  description: string;
}>;

type MoveDirection = "up" | "down";

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

export function clearFormDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function getFirstSectionId(form: FormDefinition) {
  return form.sections?.[0]?.id ?? null;
}

function createFreshForm() {
  return createEmptyForm();
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const rawText = await response.text();

  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(rawText || "Resposta inválida do servidor.");
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Não foi possível concluir a operação.");
  }

  return data;
}

export function useFormBuilder() {
  const seed = useMemo(() => loadDraft(), []);
  const [state, dispatch] = useReducer(reducer, initialState(seed ?? undefined));

  useEffect(() => {
    if (state.mode === "builder") {
      saveDraft(state.form);
    }
  }, [state.form, state.mode]);

  const importFormToState = (form: FormDefinition, forceBuilderMode = false) => {
    clearFormDraft();

    dispatch({ type: "IMPORT_FORM", form });
    dispatch({
      type: "SET_ACTIVE_SECTION",
      sectionId: getFirstSectionId(form)
    });

    if (forceBuilderMode) {
      dispatch({ type: "SET_MODE", mode: "builder" });
    }
  };

  const actions = useMemo(() => {
    return {
      setMode: (mode: Mode) => {
        dispatch({ type: "SET_MODE", mode });
      },

      reset: (opts?: { hard?: boolean }) => {
        const hard = !!opts?.hard;

        if (hard) {
          const emptyForm = createFreshForm();
          importFormToState(emptyForm, true);
          return;
        }

        dispatch({ type: "RESET_FORM" });
      },

      setTitle: (title: string) => {
        dispatch({ type: "SET_TITLE", title });
      },

      setActiveSection: (sectionId: string | null) => {
        dispatch({ type: "SET_ACTIVE_SECTION", sectionId });
      },

      addSection: () => {
        dispatch({ type: "ADD_SECTION" });
      },

      removeSection: (sectionId: string) => {
        dispatch({ type: "REMOVE_SECTION", sectionId });
      },

      moveSection: (sectionId: string, direction: MoveDirection) => {
        dispatch({ type: "MOVE_SECTION", sectionId, direction });
      },

      updateSection: (sectionId: string, data: SectionUpdateData) => {
        dispatch({ type: "UPDATE_SECTION", sectionId, data });
      },

      updateSectionGoTo: (sectionId: string, goTo: GoTo) => {
        dispatch({ type: "UPDATE_SECTION_GOTO", sectionId, goTo });
      },

      addQuestion: (sectionId: string, qType: QuestionType) => {
        dispatch({ type: "ADD_QUESTION", sectionId, qType });
      },

      removeQuestion: (sectionId: string, questionId: string) => {
        dispatch({ type: "REMOVE_QUESTION", sectionId, questionId });
      },

      moveQuestion: (
        sectionId: string,
        questionId: string,
        direction: MoveDirection
      ) => {
        dispatch({
          type: "MOVE_QUESTION",
          sectionId,
          questionId,
          direction
        });
      },

      updateQuestion: (
        sectionId: string,
        questionId: string,
        data: QuestionUpdateData
      ) => {
        dispatch({ type: "UPDATE_QUESTION", sectionId, questionId, data });
      },

      addOption: (sectionId: string, questionId: string) => {
        dispatch({ type: "ADD_OPTION", sectionId, questionId });
      },

      addOtherOption: (sectionId: string, questionId: string) => {
        dispatch({ type: "ADD_OTHER_OPTION", sectionId, questionId });
      },

      updateOption: (
        sectionId: string,
        questionId: string,
        index: number,
        value: string
      ) => {
        dispatch({
          type: "UPDATE_OPTION",
          sectionId,
          questionId,
          index,
          value
        });
      },

      updateOptionGoTo: (
        sectionId: string,
        questionId: string,
        index: number,
        goTo: GoTo
      ) => {
        dispatch({
          type: "UPDATE_OPTION_GOTO",
          sectionId,
          questionId,
          index,
          goTo
        });
      },

      removeOption: (
        sectionId: string,
        questionId: string,
        index: number
      ) => {
        dispatch({
          type: "REMOVE_OPTION",
          sectionId,
          questionId,
          index
        });
      },

      importEmpty: () => {
        const emptyForm = createFreshForm();
        importFormToState(emptyForm, true);
      },

      importForm: (form: FormDefinition) => {
        importFormToState(form);
      },

      load: async (formId: string, headers?: Record<string, string>) => {
        const data = await fetchJson(
          `/api/forms/get?id=${encodeURIComponent(formId)}`,
          {
            method: "GET",
            headers
          }
        );

        if (!data?.form) {
          throw new Error("Não foi possível carregar o formulário.");
        }

        importFormToState(data.form);
      }
    };
  }, []);

  const activeSection = useMemo(() => {
    return (
      state.form.sections.find(
        (section) => section.id === state.activeSectionId
      ) ?? null
    );
  }, [state.form.sections, state.activeSectionId]);

  return {
    state,
    actions,
    activeSection
  };
}
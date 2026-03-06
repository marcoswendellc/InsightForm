import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PencilSimple, Eye, FileText } from "phosphor-react";

import { useFormBuilder } from "./useFormBuilder";
import type { Mode, QuestionType } from "./types";

import SideToolbar from "./components/SideToolbar";
import SectionCard from "./components/SectionCard";

import {
  Page,
  Center,
  Header,
  TitleInput,
  Actions,
  IconBtn,
  Body,
  Subtle
} from "./page.styles";

export default function FormBuilderPage() {

  const [params, setParams] = useSearchParams();
  const { state, actions } = useFormBuilder();

  const isNew = params.get("new") === "1";
  const formId = params.get("id");

  const urlMode = (params.get("mode") as Mode | null) ?? "builder";
  const isPreview = urlMode === "preview";

  /**
   * ================================
   * URL helpers
   * ================================
   */

  const updateParams = (fn: (next: URLSearchParams) => void, replace = true) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace });
  };

  /**
   * ================================
   * Sincroniza modo
   * ================================
   */

  useEffect(() => {
    actions.setMode(urlMode);

    if (urlMode === "preview") {
      actions.setActiveSection(null);
    }

  }, [urlMode]);

  /**
   * ================================
   * Título da aba
   * ================================
   */

  useEffect(() => {

    if (isPreview) {
      document.title = "Visualizar formulário";
      return;
    }

    if (isNew) {
      document.title = "Novo formulário";
      return;
    }

    document.title = "Editar formulário";

  }, [isPreview, isNew]);

  /**
   * ================================
   * Novo formulário
   * ================================
   */

  useEffect(() => {

    if (!isNew) return;

    actions.reset({ hard: true });

    try {
      localStorage.removeItem("insightform:draft");
    } catch {}

    updateParams((p) => {
      p.delete("new");
      p.delete("mode");
    });

  }, [isNew]);

  /**
   * ================================
   * Carregar por ID (opcional)
   * ================================
   */

  useEffect(() => {

    if (isNew) return;
    if (!formId) return;

    if (typeof (actions as any).load === "function") {
      (actions as any).load(formId);
    }

  }, [formId, isNew]);

  /**
   * ================================
   * Ações de UI
   * ================================
   */

  const setMode = (mode: Mode) => {

    updateParams((p) => {

      p.set("mode", mode);
      p.delete("new");

    });

  };

  const handleNew = () => {

    updateParams((p) => {

      p.set("new", "1");
      p.delete("id");
      p.delete("mode");

    }, true);

  };

  const activeSectionId = state.activeSectionId;

  const handleAddQuestion = (type: QuestionType) => {

    if (!activeSectionId) return;

    actions.addQuestion(activeSectionId, type);

  };

  /**
   * Toolbar lateral
   */

  const canShowToolbar = useMemo(() => {

    return state.mode === "builder" && !!state.activeSectionId;

  }, [state.mode, state.activeSectionId]);

  /**
   * ================================
   * RENDER
   * ================================
   */

  return (
    <Page data-preview={isPreview ? "true" : "false"}>

      <Center data-preview={isPreview ? "true" : "false"}>

        {/* HEADER */}

        <Header>

          <div style={{ flex: 1, minWidth: 260 }}>

            <TitleInput
              placeholder="Nome do formulário"
              value={state.form.title}
              onChange={(e) => actions.setTitle(e.target.value)}
              disabled={isPreview}
            />

            <Subtle>

              {isPreview
                ? "Pré-visualização do formulário"
                : "Clique em uma seção para ativar e use o menu lateral para adicionar perguntas."}

            </Subtle>

          </div>

          <Actions>

            <IconBtn
              title="Editar"
              data-active={!isPreview}
              onClick={() => setMode("builder")}
            >
              <PencilSimple size={20} weight="bold" />
            </IconBtn>

            <IconBtn
              title="Visualizar"
              data-active={isPreview}
              onClick={() => setMode("preview")}
            >
              <Eye size={20} weight="bold" />
            </IconBtn>

            <IconBtn
              title="Novo formulário"
              onClick={handleNew}
            >
              <FileText size={20} weight="bold" />
            </IconBtn>

          </Actions>

        </Header>

        {/* BODY */}

        <Body data-preview={isPreview ? "true" : "false"}>

          {state.form.sections.map((section, index) => (

            <SectionCard
              key={section.id}

              mode={state.mode}
              section={section}
              index={index}

              active={section.id === state.activeSectionId}
              canRemove={state.form.sections.length > 1}

              allSections={state.form.sections}

              onActivate={() =>
                actions.setActiveSection(section.id)
              }

              onRemove={() =>
                actions.removeSection(section.id)
              }

              onUpdate={(data) =>
                actions.updateSection(section.id, data)
              }

              onRemoveQuestion={(questionId) =>
                actions.removeQuestion(section.id, questionId)
              }

              onUpdateQuestion={(questionId, data) =>
                actions.updateQuestion(section.id, questionId, data)
              }

              onAddOption={(questionId) =>
                actions.addOption(section.id, questionId)
              }

              onAddOtherOption={(questionId) =>
                actions.addOtherOption(section.id, questionId)
              }

              onUpdateOption={(questionId, optIndex, value) =>
                actions.updateOption(section.id, questionId, optIndex, value)
              }

              onUpdateOptionGoTo={(questionId, optIndex, goTo) =>
                actions.updateOptionGoTo(section.id, questionId, optIndex, goTo)
              }

              onRemoveOption={(questionId, optIndex) =>
                actions.removeOption(section.id, questionId, optIndex)
              }

            />

          ))}

        </Body>

      </Center>

      <SideToolbar
        canShow={canShowToolbar}
        onAddSection={actions.addSection}
        onAddQuestion={handleAddQuestion}
      />

    </Page>
  );
}
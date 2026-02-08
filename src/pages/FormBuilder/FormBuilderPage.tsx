import { useEffect } from "react";
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

console.log(">>> FormBuilderPage ATIVO <<<");

export default function FormBuilderPage() {
  const [params, setParams] = useSearchParams();
  const { state, actions } = useFormBuilder();

  // URL controla modo (preview/builder). Se não tiver, assume builder.
  const urlMode = (params.get("mode") as Mode | null) ?? "builder";
  const isPreview = urlMode === "preview";

  // Mantém o estado alinhado com a URL
  useEffect(() => {
    actions.setMode(urlMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMode]);

  useEffect(() => {
    document.title = isPreview ? "Visualizar formulário" : "Editar formulário";
  }, [isPreview]);

  const setMode = (mode: Mode) => {
    // Atualiza URL (pra ficar copiável)
    const next = new URLSearchParams(params);
    next.set("mode", mode);
    setParams(next, { replace: true });
  };

  const handleNew = () => {
    actions.reset();
    const next = new URLSearchParams(params);
    next.delete("mode"); // volta pro modo builder por padrão
    setParams(next, { replace: true });
  };

  const activeSectionId = state.activeSectionId;

  const handleAddQuestion = (type: QuestionType) => {
    if (!activeSectionId) return;
    actions.addQuestion(activeSectionId, type);
  };

  return (
    <Page>
      <Center>
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
                ? "Modo visualização (somente leitura)."
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

            <IconBtn title="Novo formulário" onClick={handleNew}>
              <FileText size={20} weight="bold" />
            </IconBtn>
          </Actions>
        </Header>

        {/* BODY */}
        <Body>
          {state.form.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              mode={state.mode}
              section={section}
              index={index}
              active={section.id === state.activeSectionId}
              canRemove={state.form.sections.length > 1}
              onActivate={() => actions.setActiveSection(section.id)}
              onRemove={() => actions.removeSection(section.id)}
              onUpdate={(data) => actions.updateSection(section.id, data)}
              onRemoveQuestion={(questionId) =>
                actions.removeQuestion(section.id, questionId)
              }
              onUpdateQuestion={(questionId, data) =>
                actions.updateQuestion(section.id, questionId, data)
              }
              onAddOption={(questionId) => actions.addOption(section.id, questionId)}
              onUpdateOption={(questionId, optIndex, value) =>
                actions.updateOption(section.id, questionId, optIndex, value)
              }
              onRemoveOption={(questionId, optIndex) =>
                actions.removeOption(section.id, questionId, optIndex)
              }
            />
          ))}
        </Body>
      </Center>

      {/* TOOLBAR LATERAL (somente no modo builder) */}
      <SideToolbar
        canShow={state.mode === "builder" && !!state.activeSectionId}
        onAddSection={actions.addSection}
        onAddQuestion={handleAddQuestion}
      />
    </Page>
  );
}

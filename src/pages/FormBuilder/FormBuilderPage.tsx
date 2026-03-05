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

/**
 * CONTRATO DE URL (fonte da verdade)
 * - Novo:      /builder?new=1
 * - Editar:    /builder?id=123
 * - Preview:   /builder?id=123&mode=preview
 *
 * Observação importante:
 * - Para "Novo" abrir sempre vazio, o reset precisa ser "hard",
 *   ou seja, não pode reidratar do localStorage/draft.
 */
export default function FormBuilderPage() {
  const [params, setParams] = useSearchParams();
  const { state, actions } = useFormBuilder();

  // ---- URL state ----
  const isNew = params.get("new") === "1";
  const formId = params.get("id"); // quando você tiver edição real
  const urlMode = (params.get("mode") as Mode | null) ?? "builder";
  const isPreview = urlMode === "preview";

  // ---- Helpers ----
  const updateParams = (fn: (next: URLSearchParams) => void, replace = true) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace });
  };

  // Modo vindo da URL sempre ganha
  useEffect(() => {
    actions.setMode(urlMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMode]);

  // Título da aba
  useEffect(() => {
    if (isPreview) document.title = "Visualizar formulário";
    else if (isNew) document.title = "Novo formulário";
    else document.title = "Editar formulário";
  }, [isPreview, isNew]);

  /**
   * NOVO FORMULÁRIO (hard reset)
   * - Reseta o estado
   * - Não deixa o draft/localStorage "vencer"
   * - Limpa a URL pra não ficar preso em new=1
   */
  useEffect(() => {
    if (!isNew) return;

    // 1) Reset "hard" (ideal: seu hook suportar reset({ hard: true }))
    // Se seu actions.reset ainda não recebe params, ajuste o hook:
    //   reset(options?: { hard?: boolean })
    // Aqui eu chamo com { hard: true } (recomendado).
    actions.reset({ hard: true });

    // 2) Se você usa rascunho no storage, limpe aqui.
    // Ajuste a chave para a sua (se existir).
    try {
      localStorage.removeItem("insightform:draft");
    } catch {}

    // 3) Limpa new=1 e mode pra voltar pro builder "normal"
    updateParams((p) => {
      p.delete("new");
      p.delete("mode");
      // se você quiser já criar um "id de rascunho" e botar na URL, faça no hook
      // e depois setar aqui via actions/state (exige que o hook exponha o id novo).
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  /**
   * (Opcional) Editar por ID (quando você tiver API/DB)
   * Se existir formId e não for "new", você pode carregar o form aqui.
   * Deixei preparado, mas não forço nada pra não quebrar seu fluxo atual.
   */
  useEffect(() => {
    if (isNew) return;
    if (!formId) return;

    // Se seu hook tiver algo como actions.load(formId):
    if (typeof (actions as any).load === "function") {
      (actions as any).load(formId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, isNew]);

  // ---- Actions UI ----
  const setMode = (mode: Mode) => {
    updateParams((p) => {
      p.set("mode", mode);
      p.delete("new"); // se por algum motivo ainda existir
    });
  };

  const handleNew = () => {
    updateParams((p) => {
      p.set("new", "1");
      p.delete("id");   // novo não deve herdar id
      p.delete("mode"); // volta pro builder padrão
    }, true);
  };

  const activeSectionId = state.activeSectionId;

  const handleAddQuestion = (type: QuestionType) => {
    if (!activeSectionId) return;
    actions.addQuestion(activeSectionId, type);
  };

  // Toolbar só aparece quando faz sentido
  const canShowToolbar = useMemo(
    () => state.mode === "builder" && !!state.activeSectionId,
    [state.mode, state.activeSectionId]
  );

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

              allSections={state.form.sections} // ✅ NOVO

              onActivate={() => actions.setActiveSection(section.id)}
              onRemove={() => actions.removeSection(section.id)}
              onUpdate={(data) => actions.updateSection(section.id, data)}

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
                actions.addOtherOption(section.id, questionId) // ✅ NOVO
              }

              onUpdateOption={(questionId, optIndex, value) =>
                actions.updateOption(section.id, questionId, optIndex, value)
              }

              onUpdateOptionGoTo={(questionId, optIndex, goTo) =>
                actions.updateOptionGoTo(section.id, questionId, optIndex, goTo) // ✅ NOVO
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
        canShow={canShowToolbar}
        onAddSection={actions.addSection}
        onAddQuestion={handleAddQuestion}
      />
    </Page>
  );
}
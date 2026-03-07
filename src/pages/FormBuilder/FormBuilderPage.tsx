import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PencilSimple,
  Eye,
  FileText,
  FloppyDisk,
  FolderOpen
} from "phosphor-react";

import FormPreview from "./components/FormPreview";
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

type ListedForm = {
  id: string;
  title: string;
  status?: string;
  updated_at?: string;
};

function formatDate(value?: string) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export default function FormBuilderPage() {
  const [params, setParams] = useSearchParams();
  const { state, actions } = useFormBuilder();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [forms, setForms] = useState<ListedForm[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState("");

  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [loadFormError, setLoadFormError] = useState("");

  const isNew = params.get("new") === "1";
  const formId = params.get("id");

  const urlMode = (params.get("mode") as Mode | null) ?? "builder";
  const isPreview = urlMode === "preview";

  const shouldShowList = !formId && !isNew;

  const updateParams = (fn: (next: URLSearchParams) => void, replace = true) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace });
  };

  useEffect(() => {
    if (shouldShowList) {
      document.title = "Formulários";
      return;
    }

    if (isPreview) {
      document.title = "Visualizar formulário";
      return;
    }

    if (isNew) {
      document.title = "Novo formulário";
      return;
    }

    document.title = "Editar formulário";
  }, [shouldShowList, isPreview, isNew]);

  useEffect(() => {
    if (shouldShowList) return;

    actions.setMode(urlMode);

    if (urlMode === "preview") {
      actions.setActiveSection(null);
    }
  }, [urlMode, shouldShowList, actions]);

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
  }, [isNew, actions]);

  useEffect(() => {
    if (isNew) return;
    if (!formId) return;

    let cancelled = false;

    const run = async () => {
      setIsLoadingForm(true);
      setLoadFormError("");
      setSaveMessage("");

      try {
        await actions.load(formId);
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error ? error.message : "Erro ao carregar formulário.";
        setLoadFormError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingForm(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [formId, isNew, actions]);

  useEffect(() => {
    if (!shouldShowList) return;

    const loadForms = async () => {
      setIsLoadingForms(true);
      setFormsError("");

      try {
        const response = await fetch("/api/forms/list");
        const rawText = await response.text();

        let data: any = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          throw new Error(rawText || "Resposta inválida ao listar formulários.");
        }

        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "Não foi possível carregar os formulários.");
        }

        setForms(Array.isArray(data.forms) ? data.forms : []);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar formulários.";
        setFormsError(message);
        setForms([]);
      } finally {
        setIsLoadingForms(false);
      }
    };

    loadForms();
  }, [shouldShowList]);

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

  const handleOpenForm = (id: string) => {
    updateParams((p) => {
      p.set("id", id);
      p.delete("new");
      p.delete("mode");
    }, true);
  };

  const handleBackToList = () => {
    updateParams((p) => {
      p.delete("id");
      p.delete("new");
      p.delete("mode");
    }, true);
  };

  const handleSave = async () => {
    if (isPreview) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      const payload = {
        id: formId ?? state.form.id,
        form: state.form
      };

      const response = await fetch("/api/forms/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();

      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(rawText || "O servidor retornou uma resposta inválida.");
      }

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Não foi possível salvar o formulário.");
      }

      if (data.id) {
        updateParams((p) => {
          p.set("id", data.id);
          p.delete("new");
        });
      }

      setSaveMessage("Formulário salvo com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar o formulário.";
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const activeSectionId = state.activeSectionId;

  const handleAddQuestion = (type: QuestionType) => {
    if (!activeSectionId) return;
    actions.addQuestion(activeSectionId, type);
  };

  const canShowToolbar = useMemo(() => {
    return !shouldShowList && state.mode === "builder" && !!state.activeSectionId;
  }, [shouldShowList, state.mode, state.activeSectionId]);

  if (shouldShowList) {
    return (
      <Page data-preview="false">
        <Center data-preview="false">
          <Header>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#202124"
                }}
              >
                Formulários
              </div>

              <Subtle>
                Crie um novo formulário ou abra um formulário salvo para continuar.
              </Subtle>
            </div>

            <Actions>
              <IconBtn title="Novo formulário" onClick={handleNew}>
                <FileText size={20} weight="bold" />
              </IconBtn>
            </Actions>
          </Header>

          <Body data-preview="false">
            {isLoadingForms ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
                }}
              >
                Carregando formulários...
              </div>
            ) : formsError ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  color: "#d93025",
                  fontWeight: 500
                }}
              >
                {formsError}
              </div>
            ) : forms.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, color: "#202124" }}>
                  Nenhum formulário encontrado
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "rgba(0,0,0,0.6)",
                    lineHeight: 1.5
                  }}
                >
                  Clique no botão de novo formulário para começar.
                </div>
              </div>
            ) : (
              forms.map((form) => (
                <button
                  key={form.id}
                  onClick={() => handleOpenForm(form.id)}
                  style={{
                    width: "100%",
                    background: "#fff",
                    border: "none",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: "rgba(103,58,183,0.12)",
                        display: "grid",
                        placeItems: "center",
                        color: "#673ab7"
                      }}
                    >
                      <FolderOpen size={20} weight="bold" />
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#202124"
                        }}
                      >
                        {form.title || "Formulário sem título"}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 13,
                          color: "rgba(0,0,0,0.6)"
                        }}
                      >
                        Atualizado em {formatDate(form.updated_at)}
                        {form.status ? ` • ${form.status}` : ""}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      color: "#673ab7",
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    Abrir
                  </div>
                </button>
              ))
            )}
          </Body>
        </Center>
      </Page>
    );
  }

  return (
    <Page data-preview={isPreview ? "true" : "false"}>
      <Center data-preview={isPreview ? "true" : "false"}>
        <Header>
          <div style={{ flex: 1, minWidth: 260 }}>
            <TitleInput
              placeholder="Nome do formulário"
              value={state.form.title}
              onChange={(e) => actions.setTitle(e.target.value)}
              disabled={isPreview || isLoadingForm}
            />

            <Subtle>
              {isLoadingForm
                ? "Carregando formulário..."
                : loadFormError
                ? loadFormError
                : isPreview
                ? "Pré-visualização do formulário"
                : saveMessage ||
                  "Clique em uma seção para ativar e use o menu lateral para adicionar perguntas."}
            </Subtle>
          </div>

          <Actions>
            {!isPreview && (
              <IconBtn
                title={isSaving ? "Salvando..." : "Salvar"}
                onClick={handleSave}
                disabled={isSaving || isLoadingForm}
              >
                <FloppyDisk size={20} weight="bold" />
              </IconBtn>
            )}

            <IconBtn title="Voltar para lista" onClick={handleBackToList}>
              <FolderOpen size={20} weight="bold" />
            </IconBtn>

            <IconBtn
              title="Editar"
              data-active={!isPreview}
              onClick={() => setMode("builder")}
              disabled={isLoadingForm}
            >
              <PencilSimple size={20} weight="bold" />
            </IconBtn>

            <IconBtn
              title="Visualizar"
              data-active={isPreview}
              onClick={() => setMode("preview")}
              disabled={isLoadingForm}
            >
              <Eye size={20} weight="bold" />
            </IconBtn>

            <IconBtn title="Novo formulário" onClick={handleNew}>
              <FileText size={20} weight="bold" />
            </IconBtn>
          </Actions>
        </Header>

        <Body data-preview={isPreview ? "true" : "false"}>
          {isLoadingForm ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
              }}
            >
              Carregando formulário...
            </div>
          ) : loadFormError ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                color: "#d93025",
                fontWeight: 500
              }}
            >
              {loadFormError}
            </div>
          ) : isPreview ? (
            <FormPreview form={state.form} />
          ) : (
            state.form.sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                active={section.id === state.activeSectionId}
                canRemove={state.form.sections.length > 1}
                allSections={state.form.sections}
                onActivate={() => actions.setActiveSection(section.id)}
                onRemove={() => actions.removeSection(section.id)}
                onUpdate={(data) => actions.updateSection(section.id, data)}
                onUpdateSectionGoTo={(goTo) =>
                  actions.updateSectionGoTo(section.id, goTo)
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
            ))
          )}
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
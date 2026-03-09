import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PencilSimple,
  Eye,
  FileText,
  FloppyDisk,
  FolderOpen,
  PaperPlaneTilt
} from "phosphor-react";

import { useAuth } from "../../auth/AuthContext";
import FormPreview from "./components/FormPreview";
import FormResponsePage from "./components/FormResponsePage";
import { useFormBuilder, STORAGE_KEY } from "./useFormBuilder";
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

async function parseJsonResponse(response: Response) {
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

export default function FormBuilderPage() {
  const [params, setParams] = useSearchParams();
  const { user, authHeader } = useAuth();
  const { state, actions } = useFormBuilder();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [forms, setForms] = useState<ListedForm[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState("");

  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [loadFormError, setLoadFormError] = useState("");

  const isAdmin = user?.role === "admin";

  const isNew = params.get("new") === "1";
  const formId = params.get("id");

  const urlMode = (params.get("mode") as Mode | null) ?? "builder";
  const isPreview = urlMode === "preview";
  const isRespond = urlMode === "respond";

  const shouldShowList = !formId && !isNew;

  const updateParams = (
    fn: (next: URLSearchParams) => void,
    replace = true
  ) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace });
  };

  useEffect(() => {
    if (shouldShowList) {
      document.title = "Formulários";
      return;
    }

    if (isRespond) {
      document.title = "Responder formulário";
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
  }, [shouldShowList, isRespond, isPreview, isNew]);

  useEffect(() => {
    if (shouldShowList) return;

    const safeMode: Mode =
      isRespond || isPreview || isAdmin ? urlMode : "respond";

    actions.setMode(safeMode);

    if (safeMode === "preview" || safeMode === "respond") {
      actions.setActiveSection(null);
    }
  }, [urlMode, shouldShowList, actions, isRespond, isPreview, isAdmin]);

  useEffect(() => {
    if (!isNew) return;
    if (!isAdmin) return;

    actions.reset({ hard: true });

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    updateParams((p) => {
      p.delete("new");
      p.delete("mode");
    });
  }, [isNew, isAdmin, actions]);

  useEffect(() => {
    if (isNew) return;
    if (!formId) return;

    let cancelled = false;

    const run = async () => {
      setIsLoadingForm(true);
      setLoadFormError("");
      setSaveMessage("");

      try {
        await actions.load(formId, authHeader());
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar formulário.";

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
  }, [formId, isNew, actions, authHeader]);

  useEffect(() => {
    if (!shouldShowList) return;

    const loadForms = async () => {
      setIsLoadingForms(true);
      setFormsError("");

      try {
        const response = await fetch("/api/forms/list", {
          headers: {
            ...authHeader()
          }
        });

        const data = await parseJsonResponse(response);
        setForms(Array.isArray(data.forms) ? data.forms : []);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar formulários.";

        setFormsError(message);
        setForms([]);
      } finally {
        setIsLoadingForms(false);
      }
    };

    loadForms();
  }, [shouldShowList, authHeader]);

  const setMode = (mode: Mode) => {
    updateParams((p) => {
      p.set("mode", mode);
      p.delete("new");
    });
  };

  const handleNew = () => {
    if (!isAdmin) return;

    updateParams(
      (p) => {
        p.set("new", "1");
        p.delete("id");
        p.delete("mode");
      },
      true
    );
  };

  const handleRespondForm = (id: string) => {
    updateParams(
      (p) => {
        p.set("id", id);
        p.set("mode", "respond");
        p.delete("new");
      },
      true
    );
  };

  const handleEditForm = (id: string) => {
    if (!isAdmin) return;

    updateParams(
      (p) => {
        p.set("id", id);
        p.set("mode", "builder");
        p.delete("new");
      },
      true
    );
  };

  const handleBackToList = () => {
    updateParams(
      (p) => {
        p.delete("id");
        p.delete("new");
        p.delete("mode");
      },
      true
    );
  };

  const handleSave = async () => {
    if (isPreview || isRespond || !isAdmin) return;

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
          "Content-Type": "application/json",
          ...authHeader()
        },
        body: JSON.stringify(payload)
      });

      const data = await parseJsonResponse(response);

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
    return (
      isAdmin &&
      !shouldShowList &&
      !isRespond &&
      state.mode === "builder" &&
      !!state.activeSectionId
    );
  }, [isAdmin, shouldShowList, isRespond, state.mode, state.activeSectionId]);

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
                Escolha um formulário para responder ou editar.
              </Subtle>
            </div>

            {isAdmin && (
              <Actions>
                <IconBtn title="Novo formulário" onClick={handleNew}>
                  <FileText size={20} weight="bold" />
                </IconBtn>
              </Actions>
            )}
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
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#202124"
                  }}
                >
                  Nenhum formulário encontrado
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "rgba(0,0,0,0.6)",
                    lineHeight: 1.5
                  }}
                >
                  {isAdmin
                    ? "Clique no botão de novo formulário para começar."
                    : "Nenhum formulário disponível no momento."}
                </div>
              </div>
            ) : (
              forms.map((form) => (
                <div
                  key={form.id}
                  style={{
                    width: "100%",
                    background: "#fff",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      flex: 1,
                      minWidth: 220
                    }}
                  >
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
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap"
                    }}
                  >
                    <button
                      onClick={() => handleRespondForm(form.id)}
                      style={{
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 14px",
                        background: "#673ab7",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Responder
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleEditForm(form.id)}
                        style={{
                          border: "1px solid rgba(103,58,183,0.25)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          background: "#fff",
                          color: "#673ab7",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </Body>
        </Center>
      </Page>
    );
  }

  return (
    <Page data-preview={isPreview || isRespond ? "true" : "false"}>
      <Center data-preview={isPreview || isRespond ? "true" : "false"}>
        <Header>
          <div style={{ flex: 1, minWidth: 260 }}>
            <TitleInput
              placeholder="Nome do formulário"
              value={state.form.title}
              onChange={(e) => actions.setTitle(e.target.value)}
              disabled={!isAdmin || isPreview || isRespond || isLoadingForm}
            />

            <Subtle>
              {isLoadingForm
                ? "Carregando formulário..."
                : loadFormError
                ? loadFormError
                : isRespond
                ? "Preencha o formulário e envie suas respostas."
                : isPreview
                ? "Pré-visualização do formulário"
                : saveMessage ||
                  "Clique em uma seção para ativar e use o menu lateral para adicionar perguntas."}
            </Subtle>
          </div>

          <Actions>
            {!isPreview && !isRespond && isAdmin && (
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

            {isAdmin && !isRespond && (
              <>
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

                <IconBtn
                  title="Responder"
                  onClick={() => setMode("respond")}
                  disabled={isLoadingForm}
                >
                  <PaperPlaneTilt size={20} weight="bold" />
                </IconBtn>

                <IconBtn title="Novo formulário" onClick={handleNew}>
                  <FileText size={20} weight="bold" />
                </IconBtn>
              </>
            )}
          </Actions>
        </Header>

        <Body data-preview={isPreview || isRespond ? "true" : "false"}>
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
          ) : isRespond ? (
            <FormResponsePage form={state.form} />
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
                  actions.updateOptionGoTo(
                    section.id,
                    questionId,
                    optIndex,
                    goTo
                  )
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
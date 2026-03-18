import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PencilSimple,
  Eye,
  FileText,
  FloppyDisk,
  FolderOpen,
  PaperPlaneTilt,
  ListBullets,
  FilePdf
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

type ListedResponse = {
  id: string;
  user_name: string;
  submitted_at?: string;
  can_edit?: boolean;
  can_print?: boolean;
};

const listColors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  primarySoft: "rgba(237,28,36,0.08)",
  primaryBorder: "rgba(237,28,36,0.25)",
  primaryIconBg: "rgba(237,28,36,0.12)",
  white: "#FFFFFF",
  text: "#202124",
  textSoft: "rgba(0,0,0,0.6)",
  danger: "#d93025",
  cardShadow: "0 10px 30px rgba(0,0,0,0.08)",
  neutralBorder: "1px solid rgba(0,0,0,0.08)",
  neutralButtonBorder: "1px solid rgba(0,0,0,0.12)"
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

function sortResponsesByDateDesc(list: ListedResponse[]) {
  return [...list].sort((a, b) => {
    const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return dateB - dateA;
  });
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

  const [expandedResponsesFormId, setExpandedResponsesFormId] = useState<string | null>(null);
  const [loadingResponsesFormId, setLoadingResponsesFormId] = useState<string | null>(null);
  const [responsesByForm, setResponsesByForm] = useState<Record<string, ListedResponse[]>>({});
  const [responsesErrorByForm, setResponsesErrorByForm] = useState<Record<string, string>>({});

  const isAdmin = user?.role === "admin";

  const isNew = params.get("new") === "1";
  const formId = params.get("id")?.trim() || "";
  const rawMode = params.get("mode");
  const urlMode = ((rawMode as Mode | null) ?? "builder");

  const isPreview = urlMode === "preview";
  const isRespond = urlMode === "respond";
  const shouldShowList = !formId && !isNew;

  const currentStatus = String((state.form as any)?.status ?? "").toLowerCase();
  const isPublished = currentStatus === "published" || currentStatus === "active";

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
    if (!isNew || !isAdmin) return;

    actions.reset({ hard: true });

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (params.get("mode") !== "builder" || params.get("id")) {
      updateParams((p) => {
        p.set("new", "1");
        p.set("mode", "builder");
        p.delete("id");
      });
    }
  }, [isNew, isAdmin, actions, params]);

  useEffect(() => {
    if (isNew || !formId) return;

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
          error instanceof Error ? error.message : "Erro ao carregar formulário.";

        actions.reset({ hard: true });
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
          error instanceof Error ? error.message : "Erro ao carregar formulários.";

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
      p.delete("responseId");
      p.delete("editResponse");
    });
  };

  const handleNew = () => {
    if (!isAdmin) return;

    updateParams(
      (p) => {
        p.set("new", "1");
        p.set("mode", "builder");
        p.delete("id");
        p.delete("responseId");
        p.delete("editResponse");
      },
      true
    );
  };

  const handleRespondForm = (id: string) => {
    if (!id?.trim()) return;

    updateParams(
      (p) => {
        p.set("id", id);
        p.set("mode", "respond");
        p.delete("new");
        p.delete("responseId");
        p.delete("editResponse");
      },
      true
    );
  };

  const handleEditForm = (id: string) => {
    if (!isAdmin || !id?.trim()) return;

    updateParams(
      (p) => {
        p.set("id", id);
        p.set("mode", "builder");
        p.delete("new");
        p.delete("responseId");
        p.delete("editResponse");
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
        p.delete("responseId");
        p.delete("editResponse");
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

  const handleTogglePublish = async () => {
    if (!isAdmin || !formId?.trim()) return;

    try {
      setSaveMessage("");

      const nextStatus = isPublished ? "draft" : "published";

      const response = await fetch("/api/forms/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader()
        },
        body: JSON.stringify({
          id: formId,
          status: nextStatus
        })
      });

      await parseJsonResponse(response);
      await actions.load(formId, authHeader());

      setSaveMessage(
        nextStatus === "published"
          ? "Formulário publicado com sucesso."
          : "Formulário voltou para edição."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o status do formulário.";

      setSaveMessage(message);
    }
  };

  const handleToggleResponses = async (targetFormId: string) => {
    if (!targetFormId?.trim()) {
      alert("formId não encontrado para este formulário.");
      return;
    }

    if (expandedResponsesFormId === targetFormId) {
      setExpandedResponsesFormId(null);
      return;
    }

    setExpandedResponsesFormId(targetFormId);

    if (responsesByForm[targetFormId]) {
      return;
    }

    setLoadingResponsesFormId(targetFormId);
    setResponsesErrorByForm((prev) => ({
      ...prev,
      [targetFormId]: ""
    }));

    try {
      const response = await fetch(
        `/api/forms/responses/list?formId=${encodeURIComponent(targetFormId)}`,
        {
          headers: {
            ...authHeader()
          }
        }
      );

      const data = await parseJsonResponse(response);
      const rawResponses = Array.isArray(data.responses) ? data.responses : [];
      const sortedResponses = sortResponsesByDateDesc(rawResponses);

      setResponsesByForm((prev) => ({
        ...prev,
        [targetFormId]: sortedResponses
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar respostas.";

      setResponsesErrorByForm((prev) => ({
        ...prev,
        [targetFormId]: message
      }));

      setResponsesByForm((prev) => ({
        ...prev,
        [targetFormId]: []
      }));
    } finally {
      setLoadingResponsesFormId((current) =>
        current === targetFormId ? null : current
      );
    }
  };

  const handleEditResponse = (
    targetFormId: string,
    responseId: string,
    canEdit = true
  ) => {
    if (!targetFormId?.trim() || !responseId?.trim() || !canEdit) return;

    updateParams(
      (p) => {
        p.set("id", targetFormId);
        p.set("mode", "respond");
        p.set("responseId", responseId);
        p.set("editResponse", "1");
        p.delete("new");
      },
      true
    );
  };

  const handleOpenResponsePdf = (
    targetFormId: string,
    responseId: string,
    canPrint = true
  ) => {
    if (!targetFormId?.trim() || !responseId?.trim() || !canPrint) return;

    const url =
      `/response-print?formId=${encodeURIComponent(targetFormId)}` +
      `&responseId=${encodeURIComponent(responseId)}`;

    window.open(url, "_blank", "noopener,noreferrer");
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
                  color: listColors.text
                }}
              >
                Formulários
              </div>

              <Subtle>
                Escolha um formulário para responder, editar ou consultar as
                respostas.
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
                  background: listColors.white,
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: listColors.cardShadow
                }}
              >
                Carregando formulários...
              </div>
            ) : formsError ? (
              <div
                style={{
                  background: listColors.white,
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: listColors.cardShadow,
                  color: listColors.danger,
                  fontWeight: 500
                }}
              >
                {formsError}
              </div>
            ) : forms.length === 0 ? (
              <div
                style={{
                  background: listColors.white,
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: listColors.cardShadow
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: listColors.text
                  }}
                >
                  Nenhum formulário encontrado
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: listColors.textSoft,
                    lineHeight: 1.5
                  }}
                >
                  {isAdmin
                    ? "Clique no botão de novo formulário para começar."
                    : "Nenhum formulário disponível no momento."}
                </div>
              </div>
            ) : (
              forms.map((form) => {
                const isExpanded = expandedResponsesFormId === form.id;
                const isLoadingResponses = loadingResponsesFormId === form.id;
                const responses = responsesByForm[form.id] ?? [];
                const responsesError = responsesErrorByForm[form.id] ?? "";

                return (
                  <div
                    key={form.id}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        background: listColors.white,
                        borderRadius: 16,
                        padding: 18,
                        boxShadow: listColors.cardShadow,
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
                            background: listColors.primaryIconBg,
                            display: "grid",
                            placeItems: "center",
                            color: listColors.primary
                          }}
                        >
                          <FolderOpen size={20} weight="bold" />
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: listColors.text
                            }}
                          >
                            {form.title || "Formulário sem título"}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: listColors.textSoft
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
                            background: listColors.primary,
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Responder
                        </button>

                        <button
                          onClick={() => handleToggleResponses(form.id)}
                          style={{
                            border: `1px solid ${listColors.primaryBorder}`,
                            borderRadius: 10,
                            padding: "10px 14px",
                            background: isExpanded
                              ? listColors.primarySoft
                              : "#fff",
                            color: listColors.primary,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <ListBullets size={18} weight="bold" />
                          Respostas
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleEditForm(form.id)}
                            style={{
                              border: `1px solid ${listColors.primaryBorder}`,
                              borderRadius: 10,
                              padding: "10px 14px",
                              background: "#fff",
                              color: listColors.primary,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          background: listColors.white,
                          borderRadius: 16,
                          padding: 18,
                          boxShadow: listColors.cardShadow
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: listColors.text,
                            marginBottom: 12
                          }}
                        >
                          Respostas do formulário
                        </div>

                        {isLoadingResponses ? (
                          <div style={{ color: "rgba(0,0,0,0.72)" }}>
                            Carregando respostas...
                          </div>
                        ) : responsesError ? (
                          <div
                            style={{
                              color: listColors.danger,
                              fontWeight: 500
                            }}
                          >
                            {responsesError}
                          </div>
                        ) : responses.length === 0 ? (
                          <div style={{ color: listColors.textSoft }}>
                            Nenhuma resposta encontrada.
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 10
                            }}
                          >
                            {responses.map((response) => (
                              <div
                                key={response.id}
                                style={{
                                  border: listColors.neutralBorder,
                                  borderRadius: 12,
                                  padding: 14,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 14,
                                  flexWrap: "wrap"
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    minWidth: 220,
                                    flex: 1
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: listColors.text
                                    }}
                                  >
                                    {response.user_name || "Usuário sem nome"}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: listColors.textSoft
                                    }}
                                  >
                                    Respondido em {formatDate(response.submitted_at)}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap"
                                  }}
                                >
                                  {response.can_edit !== false && (
                                    <button
                                      onClick={() =>
                                        handleEditResponse(
                                          form.id,
                                          response.id,
                                          !!response.can_edit
                                        )
                                      }
                                      style={{
                                        border: `1px solid ${listColors.primaryBorder}`,
                                        borderRadius: 10,
                                        padding: "9px 12px",
                                        background: "#fff",
                                        color: listColors.primary,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                      }}
                                    >
                                      <PencilSimple size={16} weight="bold" />
                                      Editar
                                    </button>
                                  )}

                                  {response.can_print !== false && (
                                    <button
                                      onClick={() =>
                                        handleOpenResponsePdf(
                                          form.id,
                                          response.id,
                                          !!response.can_print
                                        )
                                      }
                                      style={{
                                        border: listColors.neutralButtonBorder,
                                        borderRadius: 10,
                                        padding: "9px 12px",
                                        background: "#fff",
                                        color: listColors.text,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                      }}
                                    >
                                      <FilePdf size={16} weight="bold" />
                                      PDF
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap"
              }}
            >
              <TitleInput
                placeholder="Nome do formulário"
                value={state.form.title}
                onChange={(e) => actions.setTitle(e.target.value)}
                disabled={!isAdmin || isPreview || isRespond || isLoadingForm}
              />

              {formId && !isRespond && (
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isPublished
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(245,158,11,0.12)",
                    color: isPublished ? "#15803d" : "#b45309"
                  }}
                >
                  {isPublished ? "Publicado" : "Em edição"}
                </div>
              )}
            </div>

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

                <IconBtn
                  title={isPublished ? "Voltar para edição" : "Publicar formulário"}
                  onClick={handleTogglePublish}
                  disabled={isLoadingForm || !formId}
                >
                  {isPublished ? (
                    <PencilSimple size={20} weight="bold" />
                  ) : (
                    <PaperPlaneTilt size={20} weight="bold" />
                  )}
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
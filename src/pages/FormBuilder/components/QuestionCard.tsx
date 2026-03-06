import type { Mode, Question, QuestionType, Section, GoTo } from "../types";
import { Trash } from "phosphor-react";
import {
  QuestionShell,
  QuestionTop,
  QuestionMeta,
  LeftMeta,
  RightMeta,
  Pill,
  TypeSelect,
  Field,
  OptRow,
  OptInput,
  Btn,
  Footer,
  IconDangerBtn,
  ToggleWrap,
  ToggleLabel,
  ToggleSwitch,
  ToggleKnob,
  ToggleInput,
  GoToSelect,
  OtherInput
} from "./components.styles";

type Props = {
  mode: Mode;
  question: Question;
  sectionId: string;
  sections: Section[];

  onRemove: () => void;

  onUpdate: (data: {
    label?: string;
    required?: boolean;
    type?: QuestionType;
    jumpEnabled?: boolean;
  }) => void;

  onAddOption: () => void;
  onAddOtherOption: () => void;

  onUpdateOption: (index: number, value: string) => void;
  onUpdateOptionGoTo: (index: number, goTo: GoTo) => void;
  onRemoveOption: (index: number) => void;
};

function goToKey(goTo?: GoTo) {
  if (!goTo || goTo.kind === "next") return "next";
  if (goTo.kind === "submit") return "submit";
  return `section:${goTo.sectionId}`;
}

function parseGoTo(value: string): GoTo {
  if (value === "next") return { kind: "next" };
  if (value === "submit") return { kind: "submit" };
  if (value.startsWith("section:")) {
    return { kind: "section", sectionId: value.split(":")[1] };
  }
  return { kind: "next" };
}

export default function QuestionCard({
  mode,
  question,
  sectionId,
  sections,
  onRemove,
  onUpdate,
  onAddOption,
  onAddOtherOption,
  onUpdateOption,
  onUpdateOptionGoTo,
  onRemoveOption
}: Props) {
  const isBuilder = mode === "builder";
  const isPreview = mode === "preview";

  const isOptions =
    question.type === "multipleChoice" || question.type === "checkbox";

  const hasOther = !!question.options?.some((o) => o.isOther);

  const canHaveJump = isBuilder && question.type === "multipleChoice";
  const showJump = question.type === "multipleChoice" && !!question.jumpEnabled;

  return (
    <QuestionShell>
      {/* TOPO */}
      {isBuilder && (
        <QuestionTop>
          <QuestionMeta>
            <LeftMeta>
              <TypeSelect
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
              >
                <option value="text">texto</option>
                <option value="multipleChoice">múltipla escolha</option>
                <option value="checkbox">checkbox</option>
                <option value="date">data</option>
              </TypeSelect>
            </LeftMeta>

            <RightMeta>
              {question.required && <Pill data-req="true">obrigatória</Pill>}
            </RightMeta>
          </QuestionMeta>
        </QuestionTop>
      )}

      {isBuilder ? (
        <Field
          value={question.label}
          placeholder="Digite a pergunta"
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      ) : (
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            marginBottom: 12,
            lineHeight: 1.4
          }}
        >
          {question.label || "Pergunta sem título"}
          {question.required && (
            <span style={{ color: "#d93025", marginLeft: 4 }}>*</span>
          )}
        </div>
      )}

      {/* PREVIEW DO INPUT / RESPOSTA */}
      <div style={{ marginTop: isBuilder ? 10 : 0 }}>
        {question.type === "text" && (
          <input
            type="text"
            disabled={!isPreview}
            placeholder="Sua resposta"
            style={{
              width: "100%",
              padding: "10px 0",
              border: "none",
              borderBottom: "1px solid rgba(0,0,0,0.24)",
              background: "transparent",
              outline: "none",
              fontSize: 14
            }}
          />
        )}

        {question.type === "date" && (
          <input
            type="date"
            disabled={!isPreview}
            style={{
              width: "100%",
              padding: "10px 0",
              border: "none",
              borderBottom: "1px solid rgba(0,0,0,0.24)",
              background: "transparent",
              outline: "none",
              fontSize: 14
            }}
          />
        )}

        {isOptions && (
          <div style={{ display: "grid", gap: 10 }}>
            {question.options?.map((opt, i) => (
              <OptRow key={opt.id}>
                <input
                  type={question.type === "multipleChoice" ? "radio" : "checkbox"}
                  name={question.type === "multipleChoice" ? question.id : undefined}
                  disabled={!isPreview}
                />

                {opt.isOther ? (
                  <>
                    <span style={{ whiteSpace: "nowrap" }}>Outros:</span>
                    <OtherInput
                      disabled={!isPreview}
                      placeholder="Digite sua resposta"
                    />
                  </>
                ) : (
                  <OptInput
                    value={opt.label}
                    disabled={!isBuilder}
                    onChange={(e) => onUpdateOption(i, e.target.value)}
                  />
                )}

                {showJump && !opt.isOther && (
                  <GoToSelect
                    title="Ir para..."
                    disabled={!isBuilder}
                    value={goToKey(opt.goTo)}
                    onChange={(e) =>
                      onUpdateOptionGoTo(i, parseGoTo(e.currentTarget.value))
                    }
                  >
                    <option value="next">Próxima seção</option>

                    {sections
                      .filter((s) => s.id !== sectionId)
                      .map((s, idx) => (
                        <option key={s.id} value={`section:${s.id}`}>
                          Ir para: {s.title?.trim() ? s.title : `Seção ${idx + 1}`}
                        </option>
                      ))}

                    <option value="submit">Enviar formulário</option>
                  </GoToSelect>
                )}

                {isBuilder && (
                  <Btn
                    title="Remover opção"
                    onClick={() => onRemoveOption(i)}
                    style={{ width: 44 }}
                  >
                    -
                  </Btn>
                )}
              </OptRow>
            ))}

            {isBuilder && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Btn onClick={onAddOption}>+ Opção</Btn>
                {!hasOther && <Btn onClick={onAddOtherOption}>+ Outros</Btn>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      {isBuilder && (
        <Footer>
          <IconDangerBtn title="Remover pergunta" onClick={onRemove}>
            <Trash size={18} weight="bold" />
          </IconDangerBtn>

          {canHaveJump && (
            <ToggleWrap as="label" style={{ cursor: "pointer" }}>
              <ToggleLabel>Encaminhar</ToggleLabel>

              <ToggleInput
                type="checkbox"
                checked={!!question.jumpEnabled}
                onChange={() => onUpdate({ jumpEnabled: !question.jumpEnabled })}
              />

              <ToggleSwitch data-on={question.jumpEnabled ? "true" : "false"}>
                <ToggleKnob data-on={question.jumpEnabled ? "true" : "false"} />
              </ToggleSwitch>
            </ToggleWrap>
          )}

          <ToggleWrap as="label" style={{ cursor: "pointer" }}>
            <ToggleLabel>Obrigatória</ToggleLabel>

            <ToggleInput
              type="checkbox"
              checked={question.required}
              onChange={() => onUpdate({ required: !question.required })}
            />

            <ToggleSwitch data-on={question.required ? "true" : "false"}>
              <ToggleKnob data-on={question.required ? "true" : "false"} />
            </ToggleSwitch>
          </ToggleWrap>
        </Footer>
      )}
    </QuestionShell>
  );
}
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
  const canEditRequired = mode === "builder" || mode === "preview";

  const isOptions = question.type === "multipleChoice" || question.type === "checkbox";
  const hasOther = !!question.options?.some((o) => o.isOther);

  // ✅ encaminhamento: só em múltipla escolha
  const canHaveJump = isBuilder && question.type === "multipleChoice";
  const showJump = question.type === "multipleChoice" && !!question.jumpEnabled;

  const typeLabel =
    question.type === "text"
      ? "texto"
      : question.type === "multipleChoice"
      ? "múltipla escolha"
      : question.type === "checkbox"
      ? "checkbox"
      : "data";

  return (
    <QuestionShell>
      {/* TOPO */}
      <QuestionTop>
        <QuestionMeta>
          <LeftMeta>
            {isBuilder ? (
              <TypeSelect
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
              >
                <option value="text">texto</option>
                <option value="multipleChoice">múltipla escolha</option>
                <option value="checkbox">checkbox</option>
                <option value="date">data</option>
              </TypeSelect>
            ) : (
              <Pill>{typeLabel}</Pill>
            )}
          </LeftMeta>

          <RightMeta>{question.required && <Pill data-req="true">obrigatória</Pill>}</RightMeta>
        </QuestionMeta>
      </QuestionTop>

      <Field
        value={question.label}
        placeholder="Digite a pergunta"
        disabled={!isBuilder}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />

      {/* PREVIEW DO INPUT */}
      <div style={{ marginTop: 10 }}>
        {question.type === "text" && (
          <input
            disabled
            placeholder="Resposta curta"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.14)"
            }}
          />
        )}

        {question.type === "date" && (
          <input
            type="date"
            disabled
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.14)"
            }}
          />
        )}

        {isOptions && (
          <div>
            {question.options?.map((opt, i) => (
              <OptRow key={opt.id}>
                <input
                  type={question.type === "multipleChoice" ? "radio" : "checkbox"}
                  disabled
                />

                {/* ✅ OUTROS no estilo Forms */}
                {opt.isOther ? (
                  <>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Outros:</span>
                    <OtherInput disabled placeholder="Digite sua resposta" />
                  </>
                ) : (
                  <OptInput
                    value={opt.label}
                    disabled={!isBuilder}
                    onChange={(e) => onUpdateOption(i, e.target.value)}
                  />
                )}

                {/* ✅ “Ir para” só se Encaminhar estiver ON e NÃO for Outros */}
                {showJump && !opt.isOther && (
                  <GoToSelect
                    title="Ir para..."
                    disabled={!isBuilder}
                    value={goToKey(opt.goTo)}
                    onChange={(e) => onUpdateOptionGoTo(i, parseGoTo(e.currentTarget.value))}
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
      <Footer>
        {isBuilder && (
          <IconDangerBtn title="Remover pergunta" onClick={onRemove}>
            <Trash size={18} weight="bold" />
          </IconDangerBtn>
        )}

        {/* ✅ Encaminhar (antes do Obrigatória) - só múltipla escolha */}
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

        <ToggleWrap
          as="label"
          style={{ cursor: canEditRequired ? "pointer" : "not-allowed" }}
        >
          <ToggleLabel>Obrigatória</ToggleLabel>

          <ToggleInput
            type="checkbox"
            checked={question.required}
            disabled={!canEditRequired}
            onChange={() => onUpdate({ required: !question.required })}
          />

          <ToggleSwitch data-on={question.required ? "true" : "false"}>
            <ToggleKnob data-on={question.required ? "true" : "false"} />
          </ToggleSwitch>
        </ToggleWrap>
      </Footer>
    </QuestionShell>
  );
}
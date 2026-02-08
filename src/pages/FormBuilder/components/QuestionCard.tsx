import type { Mode, Question } from "../types";
import { Trash } from "phosphor-react";
import {
  QuestionShell,
  QuestionTop,
  Pill,
  Row,
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
  ToggleInput
} from "./components.styles";

type Props = {
  mode: Mode;
  question: Question;

  onRemove: () => void;
  onUpdate: (data: { label?: string; required?: boolean }) => void;

  onAddOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
};

export default function QuestionCard({
  mode,
  question,
  onRemove,
  onUpdate,
  onAddOption,
  onUpdateOption,
  onRemoveOption
}: Props) {
  const isBuilder = mode === "builder";
  const canEditRequired = mode === "builder" || mode === "preview";
  const isOptions = question.type === "multipleChoice" || question.type === "checkbox";

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
      <QuestionTop>
        <Row style={{ gap: 8 }}>
          <Pill>{typeLabel}</Pill>
          {question.required && <Pill data-req>obrigatória</Pill>}
        </Row>
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
              <OptRow key={i}>
                <input
                  type={question.type === "multipleChoice" ? "radio" : "checkbox"}
                  disabled
                />
                <OptInput
                  value={opt}
                  disabled={!isBuilder}
                  onChange={(e) => onUpdateOption(i, e.target.value)}
                />
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
              <Btn onClick={onAddOption} style={{ marginTop: 10 }}>
                + Opção
              </Btn>
            )}
          </div>
        )}
      </div>

      {/* FOOTER (igual Forms) */}
      <Footer>
        {/* Lixeira só no builder */}
        {isBuilder && (
          <IconDangerBtn title="Remover pergunta" onClick={onRemove}>
            <Trash size={18} weight="bold" />
          </IconDangerBtn>
        )}

        <ToggleWrap as="label" style={{ cursor: canEditRequired ? "pointer" : "not-allowed" }}>
          <ToggleLabel>Obrigatória</ToggleLabel>

          <ToggleInput
            type="checkbox"
            checked={question.required}
            disabled={!canEditRequired}
            onChange={() => onUpdate({ required: !question.required })}
          />

          <ToggleSwitch data-on={question.required}>
            <ToggleKnob data-on={question.required} />
          </ToggleSwitch>
        </ToggleWrap>

      </Footer>
    </QuestionShell>
  );
}

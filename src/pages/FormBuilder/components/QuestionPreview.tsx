import { useMemo } from "react";
import type { Question } from "../types";
import {
  PreviewQuestionShell,
  PreviewQuestionLabel,
  RequiredMark,
  PreviewTextInput,
  PreviewDateInput,
  PreviewOptionsList,
  PreviewOptionRow,
  PreviewOtherWrap,
  PreviewOtherInput,
  PreviewErrorText
} from "./preview.styles";

type Props = {
  question: Question;
  value?: string | string[];
  error?: string;
  onChange: (value: string | string[]) => void;
};

export default function QuestionPreview({ question, value, error, onChange }: Props) {
  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);

  const selectedCheckboxes = Array.isArray(value) ? value : [];
  const selectedRadio = typeof value === "string" ? value : "";

  const toggleCheckbox = (optionId: string) => {
    if (!Array.isArray(value)) {
      onChange([optionId]);
      return;
    }

    if (value.includes(optionId)) {
      onChange(value.filter((item) => item !== optionId));
      return;
    }

    onChange([...value, optionId]);
  };

  return (
    <PreviewQuestionShell data-error={error ? "true" : "false"}>
      <PreviewQuestionLabel>
        {question.label || "Pergunta sem título"}
        {question.required && <RequiredMark>*</RequiredMark>}
      </PreviewQuestionLabel>

      {question.type === "text" && (
        <PreviewTextInput
          type="text"
          placeholder="Sua resposta"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          data-error={error ? "true" : "false"}
        />
      )}

      {question.type === "date" && (
        <PreviewDateInput
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          data-error={error ? "true" : "false"}
        />
      )}

      {question.type === "multipleChoice" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => (
            <PreviewOptionRow key={opt.id}>
              <input
                type="radio"
                name={optionName}
                checked={selectedRadio === opt.id}
                onChange={() => onChange(opt.id)}
              />

              {opt.isOther ? (
                <PreviewOtherWrap>
                  <span>Outros:</span>
                  <PreviewOtherInput
                    placeholder="Digite sua resposta"
                    onFocus={() => onChange(opt.id)}
                  />
                </PreviewOtherWrap>
              ) : (
                <span>{opt.label || "Opção sem texto"}</span>
              )}
            </PreviewOptionRow>
          ))}
        </PreviewOptionsList>
      )}

      {question.type === "checkbox" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => (
            <PreviewOptionRow key={opt.id}>
              <input
                type="checkbox"
                checked={selectedCheckboxes.includes(opt.id)}
                onChange={() => toggleCheckbox(opt.id)}
              />

              {opt.isOther ? (
                <PreviewOtherWrap>
                  <span>Outros:</span>
                  <PreviewOtherInput
                    placeholder="Digite sua resposta"
                    onFocus={() => {
                      if (!selectedCheckboxes.includes(opt.id)) {
                        toggleCheckbox(opt.id);
                      }
                    }}
                  />
                </PreviewOtherWrap>
              ) : (
                <span>{opt.label || "Opção sem texto"}</span>
              )}
            </PreviewOptionRow>
          ))}
        </PreviewOptionsList>
      )}

      {error && <PreviewErrorText>{error}</PreviewErrorText>}
    </PreviewQuestionShell>
  );
}
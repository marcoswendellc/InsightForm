import { useMemo, useState } from "react";
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
  PreviewOtherInput
} from "./preview.styles";

type Props = {
  question: Question;
};

export default function QuestionPreview({ question }: Props) {
  const [textValue, setTextValue] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [radioValue, setRadioValue] = useState("");
  const [checkboxValues, setCheckboxValues] = useState<string[]>([]);
  const [otherValue, setOtherValue] = useState("");

  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);

  const toggleCheckbox = (value: string) => {
    setCheckboxValues((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <PreviewQuestionShell>
      <PreviewQuestionLabel>
        {question.label || "Pergunta sem título"}
        {question.required && <RequiredMark>*</RequiredMark>}
      </PreviewQuestionLabel>

      {question.type === "text" && (
        <PreviewTextInput
          type="text"
          placeholder="Sua resposta"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
        />
      )}

      {question.type === "date" && (
        <PreviewDateInput
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
        />
      )}

      {question.type === "multipleChoice" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => (
            <PreviewOptionRow key={opt.id}>
              <input
                type="radio"
                name={optionName}
                checked={radioValue === opt.id}
                onChange={() => setRadioValue(opt.id)}
              />

              {opt.isOther ? (
                <PreviewOtherWrap>
                  <span>Outros:</span>
                  <PreviewOtherInput
                    placeholder="Digite sua resposta"
                    value={otherValue}
                    onChange={(e) => {
                      setRadioValue(opt.id);
                      setOtherValue(e.target.value);
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

      {question.type === "checkbox" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => (
            <PreviewOptionRow key={opt.id}>
              <input
                type="checkbox"
                checked={checkboxValues.includes(opt.id)}
                onChange={() => toggleCheckbox(opt.id)}
              />

              {opt.isOther ? (
                <PreviewOtherWrap>
                  <span>Outros:</span>
                  <PreviewOtherInput
                    placeholder="Digite sua resposta"
                    value={otherValue}
                    onChange={(e) => {
                      if (!checkboxValues.includes(opt.id)) {
                        toggleCheckbox(opt.id);
                      }
                      setOtherValue(e.target.value);
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
    </PreviewQuestionShell>
  );
}
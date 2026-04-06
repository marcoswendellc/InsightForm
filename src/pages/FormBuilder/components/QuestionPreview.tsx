import { useMemo, useState, useEffect } from "react";
import type {
  Question,
  FormAnswerValue,
  MultipleChoiceAnswer,
  CheckboxAnswer,
  SizeValue
} from "../types";
import {
  PreviewQuestionShell,
  PreviewQuestionLabel,
  RequiredMark,
  PreviewTextInput,
  PreviewOptionsList,
  PreviewOptionRow,
  PreviewOtherWrap,
  PreviewOtherInput,
  PreviewErrorText
} from "./preview.styles";

type Props = {
  question: Question;
  value?: FormAnswerValue;
  error?: string;
  onChange: (value: FormAnswerValue) => void;
};

const INPUT_STYLE: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid rgba(0,0,0,0.3)",
  outline: "none",
  padding: "6px 4px",
  fontSize: 13,
  width: 90
};

function isMultipleChoiceObject(
  value: FormAnswerValue | undefined
): value is Exclude<MultipleChoiceAnswer, string> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "optionId" in value
  );
}

function isCheckboxObject(
  value: FormAnswerValue | undefined
): value is Exclude<CheckboxAnswer, string[]> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "selectedOptionIds" in value
  );
}

export default function QuestionPreview({
  question,
  value,
  error,
  onChange
}: Props) {
  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);

  const selectedRadio =
    typeof value === "string"
      ? value
      : isMultipleChoiceObject(value)
      ? value.optionId
      : "";

  const selectedCheckboxes: string[] = Array.isArray(value)
    ? value
    : isCheckboxObject(value)
    ? value.selectedOptionIds ?? []
    : [];

  const [sizes, setSizes] = useState<Record<string, SizeValue>>({});

  useEffect(() => {
    if (!value || !question.sizeEnabled) return;

    if (isMultipleChoiceObject(value) && value.size) {
      setSizes({ [value.optionId]: value.size });
      return;
    }

    if (isCheckboxObject(value) && value.sizes) {
      setSizes(value.sizes);
    }
  }, [value, question.sizeEnabled]);

  function updateSize(optionId: string, field: keyof SizeValue, val: string) {
    setSizes((prev) => {
      const next: Record<string, SizeValue> = {
        ...prev,
        [optionId]: {
          ...prev[optionId],
          [field]: val
        }
      };

      if (question.type === "multipleChoice") {
        const payload: MultipleChoiceAnswer = {
          optionId,
          size: next[optionId]
        };
        onChange(payload);
      }

      if (question.type === "checkbox") {
        const payload: CheckboxAnswer = {
          selectedOptionIds: selectedCheckboxes,
          sizes: next
        };
        onChange(payload);
      }

      return next;
    });
  }

  function handleSelectRadio(optionId: string) {
    if (!question.sizeEnabled) {
      onChange(optionId);
      return;
    }

    const size: SizeValue = sizes[optionId] || {
      height: "",
      width: "",
      unit: "cm"
    };

    const payload: MultipleChoiceAnswer = {
      optionId,
      size
    };

    onChange(payload);
  }

  function toggleCheckbox(optionId: string) {
    let nextSelected: string[];

    if (selectedCheckboxes.includes(optionId)) {
      nextSelected = selectedCheckboxes.filter(
        (id: string) => id !== optionId
      );
    } else {
      nextSelected = [...selectedCheckboxes, optionId];
    }

    if (!question.sizeEnabled) {
      onChange(nextSelected);
      return;
    }

    const payload: CheckboxAnswer = {
      selectedOptionIds: nextSelected,
      sizes
    };

    onChange(payload);
  }

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
        />
      )}

      {question.type === "multipleChoice" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const isSelected = selectedRadio === opt.id;
            const size = sizes[opt.id] || {};
            const hasSize = !!size.height || !!size.width || !!size.unit;

            return (
              <div key={opt.id} style={{ display: "grid", gap: 6 }}>
                <PreviewOptionRow>
                  <input
                    type="radio"
                    name={optionName}
                    checked={isSelected}
                    onChange={() => handleSelectRadio(opt.id)}
                  />

                  {opt.isOther ? (
                    <PreviewOtherWrap>
                      <span>Outros:</span>
                      <PreviewOtherInput
                        placeholder="Digite sua resposta"
                        onFocus={() => handleSelectRadio(opt.id)}
                      />
                    </PreviewOtherWrap>
                  ) : (
                    <span>{opt.label || "Opção sem texto"}</span>
                  )}
                </PreviewOptionRow>

                {question.sizeEnabled && (isSelected || hasSize) && !opt.isOther && (
                  <div style={{ display: "flex", gap: 8, paddingLeft: 24 }}>
                    <input
                      placeholder="Altura"
                      value={size.height || ""}
                      onChange={(e) =>
                        updateSize(opt.id, "height", e.target.value)
                      }
                      style={INPUT_STYLE}
                    />

                    <input
                      placeholder="Largura"
                      value={size.width || ""}
                      onChange={(e) =>
                        updateSize(opt.id, "width", e.target.value)
                      }
                      style={INPUT_STYLE}
                    />

                    <select
                      value={size.unit || "cm"}
                      onChange={(e) =>
                        updateSize(opt.id, "unit", e.target.value)
                      }
                    >
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </PreviewOptionsList>
      )}

      {question.type === "checkbox" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const isSelected = selectedCheckboxes.includes(opt.id);
            const size = sizes[opt.id] || {};
            const hasSize = !!size.height || !!size.width || !!size.unit;

            return (
              <div key={opt.id} style={{ display: "grid", gap: 6 }}>
                <PreviewOptionRow>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCheckbox(opt.id)}
                  />

                  {opt.isOther ? (
                    <PreviewOtherWrap>
                      <span>Outros:</span>
                      <PreviewOtherInput
                        placeholder="Digite sua resposta"
                        onFocus={() => toggleCheckbox(opt.id)}
                      />
                    </PreviewOtherWrap>
                  ) : (
                    <span>{opt.label || "Opção sem texto"}</span>
                  )}
                </PreviewOptionRow>

                {question.sizeEnabled && (isSelected || hasSize) && !opt.isOther && (
                  <div style={{ display: "flex", gap: 8, paddingLeft: 24 }}>
                    <input
                      placeholder="Altura"
                      value={size.height || ""}
                      onChange={(e) =>
                        updateSize(opt.id, "height", e.target.value)
                      }
                      style={INPUT_STYLE}
                    />

                    <input
                      placeholder="Largura"
                      value={size.width || ""}
                      onChange={(e) =>
                        updateSize(opt.id, "width", e.target.value)
                      }
                      style={INPUT_STYLE}
                    />

                    <select
                      value={size.unit || "cm"}
                      onChange={(e) =>
                        updateSize(opt.id, "unit", e.target.value)
                      }
                    >
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </PreviewOptionsList>
      )}

      {error && <PreviewErrorText>{error}</PreviewErrorText>}
    </PreviewQuestionShell>
  );
}
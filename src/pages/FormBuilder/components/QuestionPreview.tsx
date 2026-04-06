import { useEffect, useMemo, useState } from "react";
import type { Question } from "../types";
import {
  PreviewQuestionShell,
  PreviewQuestionLabel,
  RequiredMark,
  PreviewTextInput,
  PreviewDateInput,
  PreviewDateTimeRow,
  PreviewDateTimeField,
  PreviewDateTimeLabel,
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

const INPUT_STYLE: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid rgba(0,0,0,0.3)",
  outline: "none",
  padding: "6px 4px",
  fontSize: 13,
  width: 90
};

export default function QuestionPreview({
  question,
  value,
  error,
  onChange
}: Props) {
  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);

  const selectedCheckboxes = Array.isArray(value) ? value : [];
  const selectedRadio = typeof value === "string" ? value : "";

  // 🔥 estado de tamanho por opção
  const [sizes, setSizes] = useState<
    Record<string, { width?: string; height?: string; unit?: string }>
  >({});

  function updateSize(optionId: string, field: string, val: string) {
    setSizes((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        [field]: val
      }
    }));
  }

  const toggleCheckbox = (optionId: string) => {
    if (!Array.isArray(value)) {
      onChange([optionId]);
      return;
    }

    if (value.includes(optionId)) {
      onChange(value.filter((item) => item !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  return (
    <PreviewQuestionShell data-error={error ? "true" : "false"}>
      <PreviewQuestionLabel>
        {question.label || "Pergunta sem título"}
        {question.required && <RequiredMark>*</RequiredMark>}
      </PreviewQuestionLabel>

      {/* TEXTO */}
      {question.type === "text" && (
        <PreviewTextInput
          type="text"
          placeholder="Sua resposta"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* MULTIPLE CHOICE */}
      {question.type === "multipleChoice" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const isSelected = selectedRadio === opt.id;
            const size = sizes[opt.id] || {};

            return (
              <div key={opt.id} style={{ display: "grid", gap: 6 }}>
                <PreviewOptionRow>
                  <input
                    type="radio"
                    name={optionName}
                    checked={isSelected}
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

                {/* 🔥 TAMANHO */}
                {question.sizeEnabled && isSelected && !opt.isOther && (
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

      {/* CHECKBOX */}
      {question.type === "checkbox" && (
        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const isSelected = selectedCheckboxes.includes(opt.id);
            const size = sizes[opt.id] || {};

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
                        onFocus={() => {
                          if (!isSelected) toggleCheckbox(opt.id);
                        }}
                      />
                    </PreviewOtherWrap>
                  ) : (
                    <span>{opt.label || "Opção sem texto"}</span>
                  )}
                </PreviewOptionRow>

                {/* 🔥 TAMANHO */}
                {question.sizeEnabled && isSelected && !opt.isOther && (
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
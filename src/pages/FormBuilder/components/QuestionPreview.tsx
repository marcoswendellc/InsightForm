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
  PreviewErrorText,
  PreviewSizeBlock,
  PreviewSizeRow,
  PreviewSizeHint,
  PreviewSizeFieldLabel,
  PreviewSizeInput,
  PreviewSizeSelect
} from "./preview.styles";

type SizeUnit = "cm" | "m" | "mm";

type SizeValue = {
  width?: string;
  height?: string;
  unit?: SizeUnit | string;
};

type ChoiceWithSizeValue = {
  optionId?: string;
  text?: string;
  size?: SizeValue;
};

export type QuestionAnswerValue =
  | string
  | string[]
  | ChoiceWithSizeValue
  | ChoiceWithSizeValue[]
  | undefined;

type Props = {
  question: Question;
  value?: QuestionAnswerValue;
  error?: string;
  disabled?: boolean;
  onChange: (value: QuestionAnswerValue) => void;
};

const SIZE_UNITS: SizeUnit[] = ["cm", "m", "mm"];

/* ---------------- utils ---------------- */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChoiceWithSizeValue(value: unknown): value is ChoiceWithSizeValue {
  return isObject(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeUnit(value: unknown): SizeUnit {
  const unit = normalizeString(value) as SizeUnit;
  return SIZE_UNITS.includes(unit) ? unit : "cm";
}

function hasSizeEnabled(question: Question) {
  return (
    (question.type === "multipleChoice" || question.type === "checkbox") &&
    Boolean((question as any).sizeEnabled)
  );
}

/* 🔥 corrigido (template string) */
function sanitizeDimensionInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const normalized = cleaned.replace(/\./g, ",");
  const parts = normalized.split(",");

  if (parts.length <= 1) return normalized;

  return `${parts[0]},${parts.slice(1).join("")}`;
}


/* ---------------- helpers ---------------- */

function getChoiceOptionId(value: QuestionAnswerValue): string {
  if (typeof value === "string") return value;
  if (isChoiceWithSizeValue(value)) return normalizeString(value.optionId);
  return "";
}

function getChoiceText(value: QuestionAnswerValue): string {
  if (isChoiceWithSizeValue(value)) return normalizeString(value.text);
  return "";
}

function getChoiceSize(value: QuestionAnswerValue): SizeValue {
  if (isChoiceWithSizeValue(value) && isObject(value.size)) {
    return {
      width: normalizeString(value.size.width),
      height: normalizeString(value.size.height),
      unit: normalizeUnit(value.size.unit)
    };
  }
  return { width: "", height: "", unit: "cm" };
}

function renderQuestionLabel(question: Question) {
  return (
    <PreviewQuestionLabel>
      {question.label?.trim() || "Pergunta sem título"}
      {question.required && <RequiredMark>*</RequiredMark>}
    </PreviewQuestionLabel>
  );
}

function sizeCardStyle(selected: boolean): React.CSSProperties {
  return {
    display: "grid",
    gap: 10,
    padding: 16,
    border: `1px solid ${selected ? "#f3b4b4" : "#e5e7eb"}`,
    borderRadius: 16,
    background: selected ? "#fffafa" : "#fff"
  };
}

function optionTextStyle(): React.CSSProperties {
  return {
    fontSize: 14,
    lineHeight: 1.45
  };
}

/* ================= COMPONENT ================= */

export default function QuestionPreview({
  question,
  value,
  error,
  disabled,
  onChange
}: Props) {
  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);
  const sizeEnabled = hasSizeEnabled(question);

  const selectedId = getChoiceOptionId(value);
  const selectedText = getChoiceText(value);
  const selectedSize = getChoiceSize(value);

  /* ---------------- TEXT ---------------- */

  if (question.type === "text") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderQuestionLabel(question)}

        <PreviewTextInput
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Sua resposta"
        />

        {error && <PreviewErrorText>{error}</PreviewErrorText>}
      </PreviewQuestionShell>
    );
  }

  /* ---------------- DATE ---------------- */

  if (question.type === "date") {
    return (
      <PreviewQuestionShell>
        {renderQuestionLabel(question)}

        <PreviewDateInput
          type={question.includeTime ? "datetime-local" : "date"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </PreviewQuestionShell>
    );
  }

  /* ---------------- MULTIPLE ---------------- */

  if (question.type === "multipleChoice") {
    return (
      <PreviewQuestionShell>
        {renderQuestionLabel(question)}

        <PreviewOptionsList>
          {question.options?.map((option) => {
            const checked = selectedId === option.id;

            return (
              <div key={option.id} style={sizeCardStyle(checked)}>
                <PreviewOptionRow>
                  <input
                    type="radio"
                    name={optionName}
                    checked={checked}
                    onChange={() =>
                      onChange({
                        optionId: option.id,
                        text: option.isOther ? selectedText : "",
                        size: selectedSize
                      })
                    }
                  />
                  <span style={optionTextStyle()}>{option.label}</span>
                </PreviewOptionRow>

                {checked && sizeEnabled && (
                  <PreviewSizeBlock>
                    <PreviewSizeRow>
                      <div>
                        <PreviewSizeFieldLabel>Largura</PreviewSizeFieldLabel>
                        <PreviewSizeInput
                          value={selectedSize.width}
                          onChange={(e) =>
                            onChange({
                              optionId: option.id,
                              size: {
                                ...selectedSize,
                                width: sanitizeDimensionInput(e.target.value)
                              }
                            })
                          }
                        />
                      </div>

                      <div>
                        <PreviewSizeFieldLabel>Altura</PreviewSizeFieldLabel>
                        <PreviewSizeInput
                          value={selectedSize.height}
                          onChange={(e) =>
                            onChange({
                              optionId: option.id,
                              size: {
                                ...selectedSize,
                                height: sanitizeDimensionInput(e.target.value)
                              }
                            })
                          }
                        />
                      </div>

                      <div>
                        <PreviewSizeFieldLabel>Unidade</PreviewSizeFieldLabel>
                        <PreviewSizeSelect
                          value={selectedSize.unit}
                          onChange={(e) =>
                            onChange({
                              optionId: option.id,
                              size: {
                                ...selectedSize,
                                unit: e.target.value
                              }
                            })
                          }
                        >
                          {SIZE_UNITS.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </PreviewSizeSelect>
                      </div>
                    </PreviewSizeRow>

                    <PreviewSizeHint>
                      Informe as dimensões. Ex: 1,20 × 0,80 m
                    </PreviewSizeHint>
                  </PreviewSizeBlock>
                )}
              </div>
            );
          })}
        </PreviewOptionsList>
      </PreviewQuestionShell>
    );
  }

  return (
    <PreviewQuestionShell>
      {renderQuestionLabel(question)}
    </PreviewQuestionShell>
  );
}
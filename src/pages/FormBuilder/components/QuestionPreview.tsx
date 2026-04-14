import { useMemo } from "react";
import type { Question, Option } from "../types";
import {
  PreviewQuestionShell,
  PreviewQuestionLabel,
  RequiredMark,
  PreviewTextInput,
  PreviewDateInput,
  PreviewOptionsList,
  PreviewOptionRow,
  PreviewOtherInput,
  PreviewErrorText,
  PreviewSizeBlock,
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

/* ================= UTILS ================= */

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
  return question.type === "multipleChoice" || question.type === "checkbox"
    ? Boolean((question as Question & { sizeEnabled?: boolean }).sizeEnabled)
    : false;
}

function sanitizeDimensionInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const normalizedComma = cleaned.replace(/\./g, ",");
  const parts = normalizedComma.split(",");

  if (parts.length <= 1) return normalizedComma;

  return `${parts[0]},${parts.slice(1).join("")}`;
}

function normalizeDimensionOnBlur(raw: string): string {
  const sanitized = sanitizeDimensionInput(raw).trim();
  if (!sanitized) return "";

  const hasDecimal = sanitized.includes(",");
  const [integerPartRaw, decimalPartRaw = ""] = sanitized.split(",");

  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = decimalPartRaw.replace(/0+$/, "");

  if (!hasDecimal) return integerPart;
  if (!decimalPart) return integerPart;

  return `${integerPart},${decimalPart}`;
}

/* ================= HELPERS ================= */

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

  return {
    width: "",
    height: "",
    unit: "cm"
  };
}

function getCheckboxObjects(value: QuestionAnswerValue): ChoiceWithSizeValue[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    if (typeof item === "string") {
      return {
        optionId: item,
        size: { width: "", height: "", unit: "cm" }
      };
    }

    if (isChoiceWithSizeValue(item)) {
      return {
        optionId: normalizeString(item.optionId),
        text: normalizeString(item.text),
        size: {
          width: normalizeString(item.size?.width),
          height: normalizeString(item.size?.height),
          unit: normalizeUnit(item.size?.unit)
        }
      };
    }

    return {
      optionId: "",
      text: "",
      size: { width: "", height: "", unit: "cm" }
    };
  });
}

function getCheckboxSelectedIds(value: QuestionAnswerValue): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isChoiceWithSizeValue(item)) return normalizeString(item.optionId);
      return "";
    })
    .filter(Boolean);
}

function upsertCheckboxObject(
  items: ChoiceWithSizeValue[],
  optionId: string,
  updater?: (current: ChoiceWithSizeValue) => ChoiceWithSizeValue
) {
  const index = items.findIndex(
    (item) => normalizeString(item.optionId) === optionId
  );

  if (index >= 0) {
    const current = items[index];
    items[index] = updater ? updater(current) : current;
    return items;
  }

  const created = updater
    ? updater({
        optionId,
        text: "",
        size: { width: "", height: "", unit: "cm" }
      })
    : {
        optionId,
        text: "",
        size: { width: "", height: "", unit: "cm" }
      };

  items.push(created);
  return items;
}

function removeCheckboxObject(items: ChoiceWithSizeValue[], optionId: string) {
  return items.filter(
    (item) => normalizeString(item.optionId) !== normalizeString(optionId)
  );
}

function getSizeValidationMessage(size?: SizeValue): string {
  const width = normalizeString(size?.width);
  const height = normalizeString(size?.height);
  const unit = normalizeString(size?.unit);

  if (!width && !height) return "Preencha largura e altura.";
  if (!width) return "Preencha a largura.";
  if (!height) return "Preencha a altura.";
  if (!unit) return "Selecione a unidade.";

  return "";
}

/* ================= UI HELPERS ================= */

function renderQuestionLabel(question: Question) {
  return (
    <PreviewQuestionLabel>
      {question.label?.trim() || "Pergunta sem título"}
      {question.required ? <RequiredMark>*</RequiredMark> : null}
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

  const selectedChoiceId = getChoiceOptionId(value);
  const selectedChoiceText = getChoiceText(value);
  const selectedChoiceSize = getChoiceSize(value);

  const selectedCheckboxIds = getCheckboxSelectedIds(value);
  const checkboxObjects = getCheckboxObjects(value);

  /* ========= TEXT ========= */

  if (question.type === "text") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderQuestionLabel(question)}

        <PreviewTextInput
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Sua resposta"
        />

        {error && <PreviewErrorText>{error}</PreviewErrorText>}
      </PreviewQuestionShell>
    );
  }

  /* ========= DATE ========= */

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

  /* ========= MULTIPLE ========= */

  if (question.type === "multipleChoice") {
    return (
      <PreviewQuestionShell>
        {renderQuestionLabel(question)}

        <PreviewOptionsList>
          {(question.options ?? []).map((option) => {
            const checked = selectedChoiceId === option.id;

            return (
              <div key={option.id} style={sizeCardStyle(checked)}>
                <PreviewOptionRow>
                  <input
                    type="radio"
                    name={optionName}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onChange(option.id)}
                  />
                  <span style={optionTextStyle()}>{option.label}</span>
                </PreviewOptionRow>
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
import { useEffect, useState } from "react";
import type {
  Question,
  FormAnswerValue,
  SizeValue
} from "../types";
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

const MAX_DATE_DIGITS = 8;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeDateInput(value: string) {
  const digits = onlyDigits(value).slice(0, MAX_DATE_DIGITS);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function maskedDateToIso(value: string) {
  if (!value || value.length !== 10) return "";

  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";

  return `${year}-${month}-${day}`;
}

function buildDateTime(date: string, time: string) {
  if (!date) return "";
  if (!time) return date;
  return `${date}T${time}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOptionId(value: unknown): value is { optionId: string } {
  return isRecord(value) && typeof value.optionId === "string";
}

function hasSelectedOptionIds(
  value: unknown
): value is { selectedOptionIds: string[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.selectedOptionIds) &&
    value.selectedOptionIds.every((item) => typeof item === "string")
  );
}

function hasSize(value: unknown): value is { size: SizeValue } {
  return isRecord(value) && isRecord(value.size);
}

function hasSizes(value: unknown): value is { sizes: Record<string, SizeValue> } {
  return isRecord(value) && isRecord(value.sizes);
}

export default function QuestionPreview({
  question,
  value,
  error,
  onChange
}: Props) {
  const selectedRadio =
    typeof value === "string"
      ? value
      : hasOptionId(value)
      ? value.optionId
      : "";

  const selectedCheckboxes: string[] = Array.isArray(value)
    ? value
    : hasSelectedOptionIds(value)
    ? value.selectedOptionIds
    : [];

  const [dateText, setDateText] = useState("");
  const [timeText, setTimeText] = useState("");
  const [sizes, setSizes] = useState<Record<string, SizeValue>>({});

  useEffect(() => {
    if (question.type === "date") {
      if (typeof value === "string" && value) {
        const [datePart, timePart] = value.split("T");
        const parts = datePart?.split("-");

        if (parts?.length === 3) {
          setDateText(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } else {
          setDateText("");
        }

        setTimeText(timePart?.slice(0, 5) ?? "");
      } else {
        setDateText("");
        setTimeText("");
      }
    }

    if (!question.sizeEnabled) {
      setSizes({});
      return;
    }

    if (!value) {
      setSizes({});
      return;
    }

    if (hasOptionId(value) && hasSize(value)) {
      setSizes({ [value.optionId]: value.size });
      return;
    }

    if (hasSizes(value)) {
      setSizes(value.sizes);
      return;
    }

    setSizes({});
  }, [value, question.type, question.sizeEnabled]);

  function emitDateValue(nextDateText: string, nextTimeText: string) {
    const isoDate = maskedDateToIso(nextDateText);

    if (!isoDate) {
      onChange("");
      return;
    }

    if (question.includeTime) {
      onChange(buildDateTime(isoDate, nextTimeText));
      return;
    }

    onChange(isoDate);
  }

  function updateSize(optionId: string, field: keyof SizeValue, val: string) {
    setSizes((prev) => {
      const next: Record<string, SizeValue> = {
        ...prev,
        [optionId]: {
          ...(prev[optionId] ?? {}),
          [field]: val
        }
      };

      if (question.type === "multipleChoice") {
        onChange({
          optionId,
          size: next[optionId]
        } as FormAnswerValue);
      }

      if (question.type === "checkbox") {
        onChange({
          selectedOptionIds: selectedCheckboxes,
          sizes: next
        } as FormAnswerValue);
      }

      return next;
    });
  }

  function handleSelectOption(optionId: string) {
    if (question.type === "multipleChoice") {
      if (question.sizeEnabled) {
        onChange({
          optionId,
          size: sizes[optionId] ?? {}
        } as FormAnswerValue);
      } else {
        onChange(optionId);
      }
      return;
    }

    if (question.type === "checkbox") {
      const isSelected = selectedCheckboxes.includes(optionId);
      const next = isSelected
        ? selectedCheckboxes.filter((id) => id !== optionId)
        : [...selectedCheckboxes, optionId];

      if (question.sizeEnabled) {
        onChange({
          selectedOptionIds: next,
          sizes
        } as FormAnswerValue);
      } else {
        onChange(next);
      }
    }
  }

  return (
    <PreviewQuestionShell data-error={error ? "true" : "false"}>
      <PreviewQuestionLabel>
        {question.label || "Pergunta sem título"}
        {question.required && <RequiredMark>*</RequiredMark>}
      </PreviewQuestionLabel>

      {question.type === "text" && (
        <PreviewTextInput
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === "date" && !question.includeTime && (
        <PreviewDateInput
          value={dateText}
          onChange={(e) => {
            const masked = normalizeDateInput(e.target.value);
            setDateText(masked);
            emitDateValue(masked, "");
          }}
        />
      )}

      {question.type === "date" && question.includeTime && (
        <PreviewDateTimeRow>
          <PreviewDateTimeField>
            <PreviewDateTimeLabel>Data</PreviewDateTimeLabel>
            <PreviewDateInput
              value={dateText}
              onChange={(e) => {
                const masked = normalizeDateInput(e.target.value);
                setDateText(masked);
                emitDateValue(masked, timeText);
              }}
            />
          </PreviewDateTimeField>

          <PreviewDateTimeField>
            <PreviewDateTimeLabel>Hora</PreviewDateTimeLabel>
            <PreviewDateInput
              type="time"
              value={timeText}
              onChange={(e) => {
                const nextTime = e.target.value;
                setTimeText(nextTime);
                emitDateValue(dateText, nextTime);
              }}
            />
          </PreviewDateTimeField>
        </PreviewDateTimeRow>
      )}

      {(question.type === "multipleChoice" || question.type === "checkbox") && (
        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const isSelected =
              question.type === "multipleChoice"
                ? selectedRadio === opt.id
                : selectedCheckboxes.includes(opt.id);

            const size = sizes[opt.id] ?? {};
            const hasSize = Boolean(size.height || size.width);

            return (
              <div key={opt.id}>
                <PreviewOptionRow>
                  <input
                    type={question.type === "multipleChoice" ? "radio" : "checkbox"}
                    checked={isSelected}
                    onChange={() => handleSelectOption(opt.id)}
                  />

                  <span>{opt.label}</span>
                </PreviewOptionRow>

                {question.sizeEnabled && (isSelected || hasSize) && (
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
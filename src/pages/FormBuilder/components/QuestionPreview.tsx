import { useMemo } from "react";
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

const MIN_YEAR = 1900;
const MAX_YEAR = 2099;
const MAX_DATE_DIGITS = 8;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function sanitizeDateDigits(rawValue: string) {
  const digits = onlyDigits(rawValue).slice(0, MAX_DATE_DIGITS);

  let result = "";

  for (const digit of digits) {
    const next = result + digit;

    if (next.length === 1) {
      if (!["0", "1", "2", "3"].includes(next)) continue;
    }

    if (next.length === 2) {
      const day = Number(next);
      if (day < 1 || day > 31) continue;
    }

    if (next.length === 3) {
      const monthFirstDigit = next[2];
      if (!["0", "1"].includes(monthFirstDigit)) continue;
    }

    if (next.length === 4) {
      const month = Number(next.slice(2, 4));
      if (month < 1 || month > 12) continue;
    }

    if (next.length === 5) {
      const yearFirstDigit = next[4];
      if (!["1", "2"].includes(yearFirstDigit)) continue;
    }

    result = next;
  }

  return result;
}

function applyDateMaskFromDigits(digits: string) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function normalizeDateInput(value: string) {
  const safeDigits = sanitizeDateDigits(value);
  return applyDateMaskFromDigits(safeDigits);
}

function parseMaskedDate(value: string) {
  const [dayStr = "", monthStr = "", yearStr = ""] = value.split("/");

  return {
    day: Number(dayStr),
    month: Number(monthStr),
    year: Number(yearStr),
    dayStr,
    monthStr,
    yearStr
  };
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(month: number, year: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function validateMaskedDate(value: string) {
  if (!value) return false;

  const { day, month, year, dayStr, monthStr, yearStr } = parseMaskedDate(value);

  if (!dayStr || !monthStr || !yearStr) return false;
  if (dayStr.length !== 2 || monthStr.length !== 2 || yearStr.length !== 4) {
    return false;
  }

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return false;
  }

  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;

  const maxDay = getDaysInMonth(month, year);
  if (day < 1 || day > maxDay) return false;

  return true;
}

function maskedDateToIso(value: string) {
  if (!validateMaskedDate(value)) return "";

  const { dayStr, monthStr, yearStr } = parseMaskedDate(value);
  return `${yearStr}-${monthStr}-${dayStr}`;
}

function isoDateToMasked(value?: string | string[]) {
  if (typeof value !== "string" || !value) return "";

  const datePart = value.includes("T") ? value.split("T")[0] : value;
  const [year = "", month = "", day = ""] = datePart.split("-");

  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function getDatePart(value?: string | string[]) {
  if (typeof value !== "string") return "";
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
}

function getTimePart(value?: string | string[]) {
  if (typeof value !== "string") return "";
  if (!value || !value.includes("T")) return "";
  return value.split("T")[1]?.slice(0, 5) ?? "";
}

function buildDateTime(date: string, time: string) {
  if (!date && !time) return "";
  if (!date) return "";
  if (!time) return date;
  return `${date}T${time}`;
}

type DateTextInputProps = {
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

function DateTextInput({
  value,
  error,
  placeholder,
  onChange
}: DateTextInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End"
    ];

    if (allowedKeys.includes(e.key)) return;

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? value.length;
    const selectionEnd = input.selectionEnd ?? value.length;

    const currentDigits = onlyDigits(value);
    const selectedText = value.slice(selectionStart, selectionEnd);
    const selectedDigits = onlyDigits(selectedText);

    const nextDigitsLength =
      currentDigits.length - selectedDigits.length + 1;

    if (nextDigitsLength > MAX_DATE_DIGITS) {
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    onChange(normalizeDateInput(pastedText));
  }

  return (
    <PreviewDateInput
      as="input"
      type="text"
      inputMode="numeric"
      placeholder={placeholder ?? "dd/mm/aaaa"}
      value={value}
      maxLength={10}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(normalizeDateInput(e.target.value))
      }
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      data-error={error ? "true" : "false"}
    />
  );
}

export default function QuestionPreview({
  question,
  value,
  error,
  onChange
}: Props) {
  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);

  const selectedCheckboxes = Array.isArray(value) ? value : [];
  const selectedRadio = typeof value === "string" ? value : "";

  const dateIsoValue = getDatePart(value);
  const timeValue = getTimePart(value);
  const maskedDateValue = isoDateToMasked(value);

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

  function handleDateOnlyChange(maskedValue: string) {
    const isoDate = maskedDateToIso(maskedValue);
    onChange(isoDate);
  }

  function handleDateWithTimeChange(maskedValue: string) {
    const isoDate = maskedDateToIso(maskedValue);
    onChange(buildDateTime(isoDate, timeValue));
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
          data-error={error ? "true" : "false"}
        />
      )}

      {question.type === "date" && !question.includeTime && (
        <DateTextInput
          value={maskedDateValue}
          error={error}
          onChange={handleDateOnlyChange}
        />
      )}

      {question.type === "date" && question.includeTime && (
        <PreviewDateTimeRow>
          <PreviewDateTimeField>
            <PreviewDateTimeLabel>Data</PreviewDateTimeLabel>
            <DateTextInput
              value={maskedDateValue}
              error={error}
              onChange={handleDateWithTimeChange}
            />
          </PreviewDateTimeField>

          <PreviewDateTimeField>
            <PreviewDateTimeLabel>Hora</PreviewDateTimeLabel>
            <PreviewDateInput
              type="time"
              value={timeValue}
              onChange={(e) => onChange(buildDateTime(dateIsoValue, e.target.value))}
              data-error={error ? "true" : "false"}
            />
          </PreviewDateTimeField>
        </PreviewDateTimeRow>
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
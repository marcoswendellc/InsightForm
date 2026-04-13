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

/* =========================
   TYPES
========================= */

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

/* =========================
   CONSTANTS
========================= */

const SIZE_UNITS: SizeUnit[] = ["cm", "m", "mm"];

/* =========================
   HELPERS
========================= */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isChoice = (value: unknown): value is ChoiceWithSizeValue =>
  isObject(value);

const str = (v: unknown) => (typeof v === "string" ? v : "");

const normalizeUnit = (v: unknown): SizeUnit =>
  SIZE_UNITS.includes(v as SizeUnit) ? (v as SizeUnit) : "cm";

const hasSizeEnabled = (q: Question) =>
  ["multipleChoice", "checkbox"].includes(q.type) &&
  Boolean((q as any).sizeEnabled);

/* =========================
   DIMENSION FORMAT
========================= */

const sanitize = (raw: string) => {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const parts = cleaned.split(",");
  return parts.length <= 1 ? cleaned : `${parts[0]},${parts.slice(1).join("")}`;
};

const normalizeBlur = (raw: string) => {
  const s = sanitize(raw).trim();
  if (!s) return "";

  const [intRaw, decRaw = ""] = s.split(",");
  const int = intRaw.replace(/^0+(?=\d)/, "") || "0";
  const dec = decRaw.replace(/0+$/, "");

  if (!s.includes(",")) return int;
  if (!dec) return int;

  return `${int},${dec}`;
};

/* =========================
   VALUE PARSERS
========================= */

const getChoiceId = (v: QuestionAnswerValue) =>
  typeof v === "string" ? v : isChoice(v) ? str(v.optionId) : "";

const getChoiceText = (v: QuestionAnswerValue) =>
  isChoice(v) ? str(v.text) : "";

const getChoiceSize = (v: QuestionAnswerValue): SizeValue =>
  isChoice(v) && isObject(v.size)
    ? {
        width: str(v.size.width),
        height: str(v.size.height),
        unit: normalizeUnit(v.size.unit)
      }
    : { width: "", height: "", unit: "cm" };

const getCheckboxObjects = (v: QuestionAnswerValue): ChoiceWithSizeValue[] =>
  Array.isArray(v)
    ? v.map((item) =>
        typeof item === "string"
          ? { optionId: item, size: { width: "", height: "", unit: "cm" } }
          : {
              optionId: str(item.optionId),
              text: str(item.text),
              size: {
                width: str(item.size?.width),
                height: str(item.size?.height),
                unit: normalizeUnit(item.size?.unit)
              }
            }
      )
    : [];

const getCheckboxIds = (v: QuestionAnswerValue): string[] =>
  Array.isArray(v)
    ? v
        .map((i) => (typeof i === "string" ? i : str(i.optionId)))
        .filter(Boolean)
    : [];

/* =========================
   VALIDATION
========================= */

const sizeError = (size?: SizeValue) => {
  const w = str(size?.width);
  const h = str(size?.height);
  const u = str(size?.unit);

  if (!w && !h) return "Preencha largura e altura.";
  if (!w) return "Preencha a largura.";
  if (!h) return "Preencha a altura.";
  if (!u) return "Selecione a unidade.";
  return "";
};

/* =========================
   COMPONENT
========================= */

export default function QuestionPreview({
  question,
  value,
  error,
  disabled,
  onChange
}: Props) {
  const optionName = useMemo(() => `preview_${question.id}`, [question.id]);
  const sizeEnabled = hasSizeEnabled(question);

  const choiceId = getChoiceId(value);
  const choiceText = getChoiceText(value);
  const choiceSize = getChoiceSize(value);

  const checkboxIds = getCheckboxIds(value);
  const checkboxObjects = getCheckboxObjects(value);

  const mcError = useMemo(
    () =>
      question.type === "multipleChoice" && sizeEnabled && choiceId
        ? sizeError(choiceSize)
        : "",
    [question.type, sizeEnabled, choiceId, choiceSize]
  );

  const checkboxErrors = useMemo(() => {
    if (question.type !== "checkbox" || !sizeEnabled) return {};
    return checkboxObjects.reduce<Record<string, string>>((acc, item) => {
      const msg = sizeError(item.size);
      if (msg && item.optionId) acc[item.optionId] = msg;
      return acc;
    }, {});
  }, [question.type, sizeEnabled, checkboxObjects]);

  const renderLabel = () => (
    <PreviewQuestionLabel>
      {question.label?.trim() || "Pergunta sem título"}
      {question.required && <RequiredMark>*</RequiredMark>}
    </PreviewQuestionLabel>
  );

  /* =========================
     RENDER TYPES
  ========================= */

  if (question.type === "text") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderLabel()}
        <PreviewTextInput
          value={str(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Sua resposta"
        />
        {error && <PreviewErrorText>{error}</PreviewErrorText>}
      </PreviewQuestionShell>
    );
  }

  if (question.type === "date") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderLabel()}
        <PreviewDateInput
          type={question.includeTime ? "datetime-local" : "date"}
          value={str(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <PreviewErrorText>{error}</PreviewErrorText>}
      </PreviewQuestionShell>
    );
  }

  if (question.type === "multipleChoice") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderLabel()}

        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const checked = choiceId === opt.id;

            return (
              <div key={opt.id}>
                <PreviewOptionRow>
                  <input
                    type="radio"
                    name={optionName}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onChange(opt.id)}
                  />
                  <span>{opt.label}</span>
                </PreviewOptionRow>

                {checked && sizeEnabled && (
                  <PreviewSizeBlock>
                    <PreviewSizeInput
                      placeholder="Largura"
                      value={choiceSize.width}
                      onChange={(e) =>
                        onChange({
                          optionId: opt.id,
                          size: {
                            ...choiceSize,
                            width: sanitize(e.target.value)
                          }
                        })
                      }
                      onBlur={(e) =>
                        onChange({
                          optionId: opt.id,
                          size: {
                            ...choiceSize,
                            width: normalizeBlur(e.target.value)
                          }
                        })
                      }
                    />

                    <PreviewSizeInput
                      placeholder="Altura"
                      value={choiceSize.height}
                      onChange={(e) =>
                        onChange({
                          optionId: opt.id,
                          size: {
                            ...choiceSize,
                            height: sanitize(e.target.value)
                          }
                        })
                      }
                      onBlur={(e) =>
                        onChange({
                          optionId: opt.id,
                          size: {
                            ...choiceSize,
                            height: normalizeBlur(e.target.value)
                          }
                        })
                      }
                    />

                    <PreviewSizeSelect
                      value={choiceSize.unit}
                      onChange={(e) =>
                        onChange({
                          optionId: opt.id,
                          size: { ...choiceSize, unit: e.target.value }
                        })
                      }
                    >
                      {SIZE_UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </PreviewSizeSelect>

                    {mcError && <PreviewErrorText>{mcError}</PreviewErrorText>}
                  </PreviewSizeBlock>
                )}
              </div>
            );
          })}
        </PreviewOptionsList>

        {error && <PreviewErrorText>{error}</PreviewErrorText>}
      </PreviewQuestionShell>
    );
  }

  if (question.type === "checkbox") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderLabel()}

        <PreviewOptionsList>
          {question.options?.map((opt) => {
            const checked = checkboxIds.includes(opt.id);

            return (
              <PreviewOptionRow key={opt.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...checkboxIds, opt.id]
                        : checkboxIds.filter((i) => i !== opt.id)
                    )
                  }
                />
                <span>{opt.label}</span>
              </PreviewOptionRow>
            );
          })}
        </PreviewOptionsList>

        {error && <PreviewErrorText>{error}</PreviewErrorText>}
      </PreviewQuestionShell>
    );
  }

  return <PreviewQuestionShell>{renderLabel()}</PreviewQuestionShell>;
}
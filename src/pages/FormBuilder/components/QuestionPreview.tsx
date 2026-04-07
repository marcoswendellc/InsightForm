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

  if (!hasDecimal) {
    return integerPart;
  }

  if (!decimalPart) {
    return integerPart;
  }

  return `${integerPart},${decimalPart}`;
}

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
        size: {
          width: "",
          height: "",
          unit: "cm"
        }
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
      size: {
        width: "",
        height: "",
        unit: "cm"
      }
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

  if (!width && !height) {
    return "Preencha largura e altura.";
  }

  if (!width) {
    return "Preencha a largura.";
  }

  if (!height) {
    return "Preencha a altura.";
  }

  if (!unit) {
    return "Selecione a unidade.";
  }

  return "";
}

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

  const multipleChoiceLocalError = useMemo(() => {
    if (
      question.type !== "multipleChoice" ||
      !sizeEnabled ||
      !selectedChoiceId
    ) {
      return "";
    }

    return getSizeValidationMessage(selectedChoiceSize);
  }, [question.type, sizeEnabled, selectedChoiceId, selectedChoiceSize]);

  const checkboxLocalErrors = useMemo(() => {
    if (question.type !== "checkbox" || !sizeEnabled) {
      return {} as Record<string, string>;
    }

    return checkboxObjects.reduce<Record<string, string>>((acc, item) => {
      const optionId = normalizeString(item.optionId);
      if (!optionId) return acc;

      const message = getSizeValidationMessage(item.size);
      if (message) {
        acc[optionId] = message;
      }

      return acc;
    }, {});
  }, [question.type, sizeEnabled, checkboxObjects]);

  const updateMultipleChoice = (option: Option) => {
    if (!sizeEnabled) {
      onChange(option.id);
      return;
    }

    const previousSize =
      selectedChoiceId === option.id
        ? {
            width: selectedChoiceSize.width ?? "",
            height: selectedChoiceSize.height ?? "",
            unit: normalizeUnit(selectedChoiceSize.unit)
          }
        : {
            width: "",
            height: "",
            unit: "cm" as SizeUnit
          };

    const previousText =
      selectedChoiceId === option.id ? selectedChoiceText : "";

    onChange({
      optionId: option.id,
      text: option.isOther ? previousText : "",
      size: previousSize
    });
  };

  const updateMultipleChoiceText = (text: string) => {
    const option = question.options?.find(
      (item) => item.id === selectedChoiceId
    );

    if (!option) return;

    onChange({
      optionId: selectedChoiceId,
      text,
      size: sizeEnabled
        ? {
            width: selectedChoiceSize.width ?? "",
            height: selectedChoiceSize.height ?? "",
            unit: normalizeUnit(selectedChoiceSize.unit)
          }
        : undefined
    });
  };

  const updateMultipleChoiceSize = (
    field: "width" | "height",
    fieldValue: string
  ) => {
    const option = question.options?.find(
      (item) => item.id === selectedChoiceId
    );

    if (!option || !sizeEnabled) return;

    onChange({
      optionId: selectedChoiceId,
      text: option.isOther ? selectedChoiceText : "",
      size: {
        width:
          field === "width"
            ? sanitizeDimensionInput(fieldValue)
            : selectedChoiceSize.width ?? "",
        height:
          field === "height"
            ? sanitizeDimensionInput(fieldValue)
            : selectedChoiceSize.height ?? "",
        unit: normalizeUnit(selectedChoiceSize.unit)
      }
    });
  };

  const blurMultipleChoiceSize = (field: "width" | "height") => {
    const option = question.options?.find(
      (item) => item.id === selectedChoiceId
    );

    if (!option || !sizeEnabled) return;

    onChange({
      optionId: selectedChoiceId,
      text: option.isOther ? selectedChoiceText : "",
      size: {
        width:
          field === "width"
            ? normalizeDimensionOnBlur(selectedChoiceSize.width ?? "")
            : selectedChoiceSize.width ?? "",
        height:
          field === "height"
            ? normalizeDimensionOnBlur(selectedChoiceSize.height ?? "")
            : selectedChoiceSize.height ?? "",
        unit: normalizeUnit(selectedChoiceSize.unit)
      }
    });
  };

  const updateMultipleChoiceUnit = (unit: string) => {
    const option = question.options?.find(
      (item) => item.id === selectedChoiceId
    );

    if (!option || !sizeEnabled) return;

    onChange({
      optionId: selectedChoiceId,
      text: option.isOther ? selectedChoiceText : "",
      size: {
        width: selectedChoiceSize.width ?? "",
        height: selectedChoiceSize.height ?? "",
        unit: normalizeUnit(unit)
      }
    });
  };

  const toggleCheckbox = (option: Option, checked: boolean) => {
    if (!sizeEnabled) {
      const currentIds = Array.isArray(value) ? (value as string[]) : [];
      const next = checked
        ? Array.from(new Set([...currentIds, option.id]))
        : currentIds.filter((item) => item !== option.id);

      onChange(next);
      return;
    }

    let nextItems = [...checkboxObjects];

    if (checked) {
      nextItems = upsertCheckboxObject(nextItems, option.id, (current) => ({
        optionId: option.id,
        text: option.isOther ? normalizeString(current.text) : "",
        size: {
          width: normalizeString(current.size?.width),
          height: normalizeString(current.size?.height),
          unit: normalizeUnit(current.size?.unit)
        }
      }));
    } else {
      nextItems = removeCheckboxObject(nextItems, option.id);
    }

    onChange(nextItems);
  };

  const updateCheckboxText = (optionId: string, text: string) => {
    if (!sizeEnabled) return;

    const nextItems = upsertCheckboxObject(
      [...checkboxObjects],
      optionId,
      (current) => ({
        optionId,
        text,
        size: {
          width: normalizeString(current.size?.width),
          height: normalizeString(current.size?.height),
          unit: normalizeUnit(current.size?.unit)
        }
      })
    );

    onChange(nextItems);
  };

  const updateCheckboxSize = (
    optionId: string,
    field: "width" | "height",
    fieldValue: string
  ) => {
    if (!sizeEnabled) return;

    const nextItems = upsertCheckboxObject(
      [...checkboxObjects],
      optionId,
      (current) => ({
        optionId,
        text: normalizeString(current.text),
        size: {
          width:
            field === "width"
              ? sanitizeDimensionInput(fieldValue)
              : normalizeString(current.size?.width),
          height:
            field === "height"
              ? sanitizeDimensionInput(fieldValue)
              : normalizeString(current.size?.height),
          unit: normalizeUnit(current.size?.unit)
        }
      })
    );

    onChange(nextItems);
  };

  const blurCheckboxSize = (optionId: string, field: "width" | "height") => {
    if (!sizeEnabled) return;

    const nextItems = upsertCheckboxObject(
      [...checkboxObjects],
      optionId,
      (current) => ({
        optionId,
        text: normalizeString(current.text),
        size: {
          width:
            field === "width"
              ? normalizeDimensionOnBlur(
                  normalizeString(current.size?.width)
                )
              : normalizeString(current.size?.width),
          height:
            field === "height"
              ? normalizeDimensionOnBlur(
                  normalizeString(current.size?.height)
                )
              : normalizeString(current.size?.height),
          unit: normalizeUnit(current.size?.unit)
        }
      })
    );

    onChange(nextItems);
  };

  const updateCheckboxUnit = (optionId: string, unit: string) => {
    if (!sizeEnabled) return;

    const nextItems = upsertCheckboxObject(
      [...checkboxObjects],
      optionId,
      (current) => ({
        optionId,
        text: normalizeString(current.text),
        size: {
          width: normalizeString(current.size?.width),
          height: normalizeString(current.size?.height),
          unit: normalizeUnit(unit)
        }
      })
    );

    onChange(nextItems);
  };

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
          data-error={!!error}
        />

        {error ? <PreviewErrorText>{error}</PreviewErrorText> : null}
      </PreviewQuestionShell>
    );
  }

  if (question.type === "date") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderQuestionLabel(question)}

        <PreviewDateInput
          type={question.includeTime ? "datetime-local" : "date"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          data-error={!!error}
        />

        {error ? <PreviewErrorText>{error}</PreviewErrorText> : null}
      </PreviewQuestionShell>
    );
  }

  if (question.type === "multipleChoice") {
    return (
      <PreviewQuestionShell data-error={!!error}>
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
                    onChange={() => updateMultipleChoice(option)}
                  />
                  <span style={optionTextStyle()}>{option.label}</span>
                </PreviewOptionRow>

                {checked && option.isOther ? (
                  <PreviewOtherInput
                    type="text"
                    value={selectedChoiceText}
                    onChange={(e) => updateMultipleChoiceText(e.target.value)}
                    disabled={disabled}
                    placeholder="Digite sua opção"
                  />
                ) : null}

                {checked && sizeEnabled ? (
                  <PreviewSizeBlock>
                    <div>
                      <PreviewSizeFieldLabel>Largura</PreviewSizeFieldLabel>
                      <PreviewSizeInput
                        type="text"
                        inputMode="decimal"
                        value={selectedChoiceSize.width ?? ""}
                        onChange={(e) =>
                          updateMultipleChoiceSize("width", e.target.value)
                        }
                        onBlur={() => blurMultipleChoiceSize("width")}
                        disabled={disabled}
                        placeholder="Ex.: 1,20"
                      />
                    </div>

                    <div>
                      <PreviewSizeFieldLabel>Altura</PreviewSizeFieldLabel>
                      <PreviewSizeInput
                        type="text"
                        inputMode="decimal"
                        value={selectedChoiceSize.height ?? ""}
                        onChange={(e) =>
                          updateMultipleChoiceSize("height", e.target.value)
                        }
                        onBlur={() => blurMultipleChoiceSize("height")}
                        disabled={disabled}
                        placeholder="Ex.: 0,80"
                      />
                    </div>

                    <div>
                      <PreviewSizeFieldLabel>Unidade</PreviewSizeFieldLabel>
                      <PreviewSizeSelect
                        value={normalizeUnit(selectedChoiceSize.unit)}
                        onChange={(e) =>
                          updateMultipleChoiceUnit(e.target.value)
                        }
                        disabled={disabled}
                      >
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </PreviewSizeSelect>
                    </div>

                    <PreviewSizeHint>
                      Informe as dimensões da peça. Exemplo: 1,20 × 0,80 m
                    </PreviewSizeHint>

                    {multipleChoiceLocalError ? (
                      <PreviewErrorText>
                        {multipleChoiceLocalError}
                      </PreviewErrorText>
                    ) : null}
                  </PreviewSizeBlock>
                ) : null}
              </div>
            );
          })}
        </PreviewOptionsList>

        {error ? <PreviewErrorText>{error}</PreviewErrorText> : null}
      </PreviewQuestionShell>
    );
  }

  if (question.type === "checkbox") {
    return (
      <PreviewQuestionShell data-error={!!error}>
        {renderQuestionLabel(question)}

        <PreviewOptionsList>
          {(question.options ?? []).map((option) => {
            const checked = selectedCheckboxIds.includes(option.id);
            const optionValue =
              checkboxObjects.find(
                (item) => normalizeString(item.optionId) === option.id
              ) ?? {
                optionId: option.id,
                text: "",
                size: { width: "", height: "", unit: "cm" }
              };

            const optionSize = {
              width: normalizeString(optionValue.size?.width),
              height: normalizeString(optionValue.size?.height),
              unit: normalizeUnit(optionValue.size?.unit)
            };

            return (
              <div key={option.id} style={sizeCardStyle(checked)}>
                <PreviewOptionRow>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => toggleCheckbox(option, e.target.checked)}
                  />
                  <span style={optionTextStyle()}>{option.label}</span>
                </PreviewOptionRow>

                {checked && option.isOther ? (
                  <PreviewOtherInput
                    type="text"
                    value={normalizeString(optionValue.text)}
                    onChange={(e) => updateCheckboxText(option.id, e.target.value)}
                    disabled={disabled}
                    placeholder="Digite sua opção"
                  />
                ) : null}

                {checked && sizeEnabled ? (
                  <PreviewSizeBlock>
                    <div>
                      <PreviewSizeFieldLabel>Largura</PreviewSizeFieldLabel>
                      <PreviewSizeInput
                        type="text"
                        inputMode="decimal"
                        value={optionSize.width}
                        onChange={(e) =>
                          updateCheckboxSize(option.id, "width", e.target.value)
                        }
                        onBlur={() => blurCheckboxSize(option.id, "width")}
                        disabled={disabled}
                        placeholder="Ex.: 1,20"
                      />
                    </div>

                    <div>
                      <PreviewSizeFieldLabel>Altura</PreviewSizeFieldLabel>
                      <PreviewSizeInput
                        type="text"
                        inputMode="decimal"
                        value={optionSize.height}
                        onChange={(e) =>
                          updateCheckboxSize(option.id, "height", e.target.value)
                        }
                        onBlur={() => blurCheckboxSize(option.id, "height")}
                        disabled={disabled}
                        placeholder="Ex.: 0,80"
                      />
                    </div>

                    <div>
                      <PreviewSizeFieldLabel>Unidade</PreviewSizeFieldLabel>
                      <PreviewSizeSelect
                        value={optionSize.unit}
                        onChange={(e) =>
                          updateCheckboxUnit(option.id, e.target.value)
                        }
                        disabled={disabled}
                      >
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </PreviewSizeSelect>
                    </div>

                    <PreviewSizeHint>
                      Informe as dimensões desta peça. Exemplo: 1,20 × 0,80 m
                    </PreviewSizeHint>

                    {checkboxLocalErrors[option.id] ? (
                      <PreviewErrorText>
                        {checkboxLocalErrors[option.id]}
                      </PreviewErrorText>
                    ) : null}
                  </PreviewSizeBlock>
                ) : null}
              </div>
            );
          })}
        </PreviewOptionsList>

        {error ? <PreviewErrorText>{error}</PreviewErrorText> : null}
      </PreviewQuestionShell>
    );
  }

  return (
    <PreviewQuestionShell data-error={false}>
      {renderQuestionLabel(question)}
    </PreviewQuestionShell>
  );
}
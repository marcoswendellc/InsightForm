import { useMemo } from "react";
import type { Question, Option } from "../types";

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

    if (!sizeEnabled) {
      onChange(selectedChoiceId);
      return;
    }

    onChange({
      optionId: selectedChoiceId,
      text,
      size: {
        width: selectedChoiceSize.width ?? "",
        height: selectedChoiceSize.height ?? "",
        unit: normalizeUnit(selectedChoiceSize.unit)
      }
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

  const wrapperStyle: React.CSSProperties = {
    display: "grid",
    gap: 12
  };

  const questionHeaderStyle: React.CSSProperties = {
    display: "grid",
    gap: 4
  };

  const questionLabelStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: "#202124",
    lineHeight: 1.4
  };

  const requiredMarkStyle: React.CSSProperties = {
    color: "#dc2626",
    marginLeft: 6
  };

  const fieldCardStyle: React.CSSProperties = {
    display: "grid",
    gap: 10,
    marginBottom: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff"
  };

  const labelRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10
  };

  const dimGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      "minmax(90px, 120px) auto minmax(90px, 120px) minmax(74px, 90px)",
    gap: 8,
    alignItems: "center"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    outline: "none",
    fontSize: 16,
    boxSizing: "border-box"
  };

  const subtleTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#6b7280"
  };

  const localErrorStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 2
  };

  const questionHeader = (
    <div style={questionHeaderStyle}>
      <div style={questionLabelStyle}>
        {question.label?.trim() || "Pergunta sem título"}
        {question.required ? <span style={requiredMarkStyle}>*</span> : null}
      </div>
    </div>
  );

  if (question.type === "text") {
    return (
      <div style={wrapperStyle}>
        {questionHeader}

        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Sua resposta"
          style={inputStyle}
        />

        {error ? <div style={localErrorStyle}>{error}</div> : null}
      </div>
    );
  }

  if (question.type === "date") {
    return (
      <div style={wrapperStyle}>
        {questionHeader}

        <input
          type={question.includeTime ? "datetime-local" : "date"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={inputStyle}
        />

        {error ? <div style={localErrorStyle}>{error}</div> : null}
      </div>
    );
  }

  if (question.type === "multipleChoice") {
    return (
      <div style={wrapperStyle}>
        {questionHeader}

        <div>
          {(question.options ?? []).map((option) => {
            const checked = selectedChoiceId === option.id;

            return (
              <div
                key={option.id}
                style={{
                  ...fieldCardStyle,
                  borderColor: checked ? "#f3b4b4" : "#e5e7eb",
                  background: checked ? "#fffafa" : "#fff"
                }}
              >
                <label style={labelRowStyle}>
                  <input
                    type="radio"
                    name={optionName}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => updateMultipleChoice(option)}
                  />
                  <span>{option.label}</span>
                </label>

                {checked && option.isOther ? (
                  <input
                    type="text"
                    value={selectedChoiceText}
                    onChange={(e) => updateMultipleChoiceText(e.target.value)}
                    disabled={disabled}
                    placeholder="Digite sua opção"
                    style={inputStyle}
                  />
                ) : null}

                {checked && sizeEnabled ? (
                  <>
                    <div style={dimGridStyle}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={selectedChoiceSize.width ?? ""}
                        onChange={(e) =>
                          updateMultipleChoiceSize("width", e.target.value)
                        }
                        onBlur={() => blurMultipleChoiceSize("width")}
                        disabled={disabled}
                        placeholder="Largura"
                        style={inputStyle}
                      />

                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#6b7280"
                        }}
                      >
                        ×
                      </div>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={selectedChoiceSize.height ?? ""}
                        onChange={(e) =>
                          updateMultipleChoiceSize("height", e.target.value)
                        }
                        onBlur={() => blurMultipleChoiceSize("height")}
                        disabled={disabled}
                        placeholder="Altura"
                        style={inputStyle}
                      />

                      <select
                        value={normalizeUnit(selectedChoiceSize.unit)}
                        onChange={(e) =>
                          updateMultipleChoiceUnit(e.target.value)
                        }
                        disabled={disabled}
                        style={inputStyle}
                      >
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={subtleTextStyle}>
                      Informe as dimensões da peça. Exemplo: 120,5 × 80 cm
                    </div>

                    {multipleChoiceLocalError ? (
                      <div style={localErrorStyle}>
                        {multipleChoiceLocalError}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        {error ? <div style={localErrorStyle}>{error}</div> : null}
      </div>
    );
  }

  if (question.type === "checkbox") {
    return (
      <div style={wrapperStyle}>
        {questionHeader}

        <div>
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
              <div
                key={option.id}
                style={{
                  ...fieldCardStyle,
                  borderColor: checked ? "#f3b4b4" : "#e5e7eb",
                  background: checked ? "#fffafa" : "#fff"
                }}
              >
                <label style={labelRowStyle}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => toggleCheckbox(option, e.target.checked)}
                  />
                  <span>{option.label}</span>
                </label>

                {checked && option.isOther ? (
                  <input
                    type="text"
                    value={normalizeString(optionValue.text)}
                    onChange={(e) => updateCheckboxText(option.id, e.target.value)}
                    disabled={disabled}
                    placeholder="Digite sua opção"
                    style={inputStyle}
                  />
                ) : null}

                {checked && sizeEnabled ? (
                  <>
                    <div style={dimGridStyle}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={optionSize.width}
                        onChange={(e) =>
                          updateCheckboxSize(option.id, "width", e.target.value)
                        }
                        onBlur={() => blurCheckboxSize(option.id, "width")}
                        disabled={disabled}
                        placeholder="Largura"
                        style={inputStyle}
                      />

                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#6b7280"
                        }}
                      >
                        ×
                      </div>

                      <input
                        type="text"
                        inputMode="decimal"
                        value={optionSize.height}
                        onChange={(e) =>
                          updateCheckboxSize(option.id, "height", e.target.value)
                        }
                        onBlur={() => blurCheckboxSize(option.id, "height")}
                        disabled={disabled}
                        placeholder="Altura"
                        style={inputStyle}
                      />

                      <select
                        value={optionSize.unit}
                        onChange={(e) =>
                          updateCheckboxUnit(option.id, e.target.value)
                        }
                        disabled={disabled}
                        style={inputStyle}
                      >
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={subtleTextStyle}>
                      Informe as dimensões desta peça. Exemplo: 1,20 × 0,80 m
                    </div>

                    {checkboxLocalErrors[option.id] ? (
                      <div style={localErrorStyle}>
                        {checkboxLocalErrors[option.id]}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        {error ? <div style={localErrorStyle}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      {questionHeader}
    </div>
  );
}
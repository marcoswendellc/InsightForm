import { useMemo, useState } from "react";
import type { Mode, Question, QuestionType, Section, GoTo } from "../types";
import { Trash } from "phosphor-react";
import {
  QuestionShell,
  QuestionTop,
  QuestionMeta,
  LeftMeta,
  RightMeta,
  Pill,
  TypeSelect,
  Field,
  OptRow,
  OptInput,
  Btn,
  Footer,
  IconDangerBtn,
  ToggleWrap,
  ToggleLabel,
  ToggleSwitch,
  ToggleKnob,
  ToggleInput,
  GoToSelect,
  OtherInput
} from "./components.styles";

type Props = {
  mode: Mode;
  question: Question;
  sectionId: string;
  sections: Section[];
  onRemove: () => void;
  onUpdate: (data: {
    label?: string;
    required?: boolean;
    type?: QuestionType;
    jumpEnabled?: boolean;
    includeTime?: boolean;
    sizeEnabled?: boolean;
  }) => void;
  onAddOption: () => void;
  onAddOtherOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onUpdateOptionGoTo: (index: number, goTo: GoTo) => void;
  onRemoveOption: (index: number) => void;
};

const INPUT_LINE_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  border: "none",
  borderBottom: "1px solid rgba(0,0,0,0.24)",
  background: "transparent",
  outline: "none",
  fontSize: 14
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  marginBottom: 6,
  color: "rgba(0,0,0,0.6)",
  fontWeight: 600
};

const QUESTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  marginBottom: 12,
  lineHeight: 1.4
};

const ERROR_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "#d93025"
};

const MIN_YEAR = 1900;
const MAX_YEAR = 2099;
const MAX_DATE_DIGITS = 8;

function goToKey(goTo?: GoTo) {
  if (!goTo || goTo.kind === "next") return "next";
  if (goTo.kind === "submit") return "submit";
  return `section:${goTo.sectionId}`;
}

function parseGoTo(value: string): GoTo {
  if (value === "next") return { kind: "next" };
  if (value === "submit") return { kind: "submit" };
  if (value.startsWith("section:")) {
    return { kind: "section", sectionId: value.split(":")[1] };
  }
  return { kind: "next" };
}

function getSectionLabel(section: Section, index: number) {
  return section.title?.trim() ? section.title : `Seção ${index + 1}`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function clampDateDigits(value: string) {
  return onlyDigits(value).slice(0, MAX_DATE_DIGITS);
}

function applyDateMaskFromDigits(digits: string) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function normalizeDateInput(value: string) {
  const digits = clampDateDigits(value);
  return applyDateMaskFromDigits(digits);
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
  if (!value) {
    return { isValid: true, message: "" };
  }

  const { day, month, year, dayStr, monthStr, yearStr } = parseMaskedDate(value);

  if (!dayStr || !monthStr || !yearStr) {
    return {
      isValid: false,
      message: "Informe a data completa no formato dd/mm/aaaa."
    };
  }

  if (dayStr.length !== 2 || monthStr.length !== 2 || yearStr.length !== 4) {
    return { isValid: false, message: "Use o formato dd/mm/aaaa." };
  }

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return { isValid: false, message: "Data inválida." };
  }

  if (year < MIN_YEAR || year > MAX_YEAR) {
    return {
      isValid: false,
      message: `O ano deve estar entre ${MIN_YEAR} e ${MAX_YEAR}.`
    };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, message: "Mês inválido." };
  }

  const maxDay = getDaysInMonth(month, year);

  if (day < 1 || day > maxDay) {
    return { isValid: false, message: "Dia inválido." };
  }

  return { isValid: true, message: "" };
}

function formatToIsoDate(maskedDate: string) {
  const validation = validateMaskedDate(maskedDate);
  if (!validation.isValid) return "";

  const { dayStr, monthStr, yearStr } = parseMaskedDate(maskedDate);
  return `${yearStr}-${monthStr}-${dayStr}`;
}

type DateTextFieldProps = {
  label?: string;
  value: string;
  error?: string;
  disabled: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function DateTextField({
  label,
  value,
  error,
  disabled,
  placeholder,
  onChange,
  onBlur
}: DateTextFieldProps) {
  function handleChange(rawValue: string) {
    onChange(normalizeDateInput(rawValue));
  }

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
    <div style={{ display: "grid", gap: 6 }}>
      {label ? <div style={LABEL_STYLE}>{label}</div> : null}

      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder ?? "dd/mm/aaaa"}
        disabled={disabled}
        value={value}
        maxLength={10}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onBlur}
        style={INPUT_LINE_STYLE}
      />

      {!!error && <span style={ERROR_STYLE}>{error}</span>}
    </div>
  );
}

export default function QuestionCard({
  mode,
  question,
  sectionId,
  sections,
  onRemove,
  onUpdate,
  onAddOption,
  onAddOtherOption,
  onUpdateOption,
  onUpdateOptionGoTo,
  onRemoveOption
}: Props) {
  const isBuilder = mode === "builder";
  const isPreview = mode === "preview";

  const isText = question.type === "text";
  const isDate = question.type === "date";
  const isMultipleChoice = question.type === "multipleChoice";
  const isCheckbox = question.type === "checkbox";
  const isOptions = isMultipleChoice || isCheckbox;

  const hasOther = !!question.options?.some((o) => o.isOther);
  const canHaveJump = isBuilder && isMultipleChoice;
  const showJump = isMultipleChoice && !!question.jumpEnabled;

  const availableSections = useMemo(
    () => sections.filter((s) => s.id !== sectionId),
    [sections, sectionId]
  );

  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [dateError, setDateError] = useState("");

  function handleTypeChange(value: string) {
    const nextType = value as QuestionType;

    // Reset date/time values when changing away from date type
    if (nextType !== "date") {
      setDateValue("");
      setTimeValue("");
      setDateError("");
    }

    onUpdate({
      type: nextType,
      ...(nextType !== "date"
        ? { includeTime: false }
        : {}),
      ...((nextType !== "multipleChoice" && nextType !== "checkbox")
        ? { sizeEnabled: false }
        : {})
    });
  }

  function handleDateChange(nextValue: string) {
    const normalizedValue = normalizeDateInput(nextValue);
    setDateValue(normalizedValue);

    const digitsLength = onlyDigits(normalizedValue).length;

    if (!normalizedValue) {
      setDateError("");
      return;
    }

    if (digitsLength < MAX_DATE_DIGITS) {
      setDateError("");
      return;
    }

    const validation = validateMaskedDate(normalizedValue);
    setDateError(validation.isValid ? "" : validation.message);
  }

  function handleDateBlur() {
    if (!dateValue) {
      setDateError("");
      return;
    }

    const validation = validateMaskedDate(dateValue);
    setDateError(validation.isValid ? "" : validation.message);
  }

  function renderQuestionTitle() {
    if (isBuilder) {
      return (
        <Field
          value={question.label}
          placeholder="Digite a pergunta"
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      );
    }

    return (
      <div style={QUESTION_TITLE_STYLE}>
        {question.label || "Pergunta sem título"}
        {question.required && (
          <span style={{ color: "#d93025", marginLeft: 4 }}>*</span>
        )}
      </div>
    );
  }

  function renderTextInput() {
    return (
      <input
        type="text"
        disabled={!isPreview}
        placeholder="Sua resposta"
        style={INPUT_LINE_STYLE}
      />
    );
  }

  function renderDateOnlyInput() {
    return (
      <DateTextField
        value={dateValue}
        error={dateError}
        disabled={!isPreview}
        onChange={handleDateChange}
        onBlur={handleDateBlur}
      />
    );
  }

  function renderDateTimeInput() {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: "1 1 220px", minWidth: 180 }}>
            <DateTextField
              label="Data"
              value={dateValue}
              error=""
              disabled={!isPreview}
              onChange={handleDateChange}
              onBlur={handleDateBlur}
            />
          </div>

          <div style={{ flex: "1 1 160px", minWidth: 140 }}>
            <div style={LABEL_STYLE}>Hora</div>
            <input
              type="time"
              disabled={!isPreview}
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              style={INPUT_LINE_STYLE}
            />
          </div>
        </div>

        {!!dateError && <span style={ERROR_STYLE}>{dateError}</span>}
      </div>
    );
  }

  function renderOptionRow(
    opt: NonNullable<Question["options"]>[number],
    index: number
  ) {
    return (
      <OptRow key={opt.id}>
        <input
          type={isMultipleChoice ? "radio" : "checkbox"}
          name={isMultipleChoice ? question.id : undefined}
          disabled={!isPreview}
        />

        {opt.isOther ? (
          <>
            <span style={{ whiteSpace: "nowrap" }}>Outros:</span>
            <OtherInput
              disabled={!isPreview}
              placeholder="Digite sua resposta"
            />
          </>
        ) : (
          <OptInput
            value={opt.label}
            disabled={!isBuilder}
            onChange={(e) => onUpdateOption(index, e.target.value)}
          />
        )}

        {showJump && !opt.isOther && (
          <GoToSelect
            title="Ir para..."
            disabled={!isBuilder}
            value={goToKey(opt.goTo)}
            onChange={(e) =>
              onUpdateOptionGoTo(index, parseGoTo(e.currentTarget.value))
            }
          >
            <option value="next">Próxima seção</option>

            {availableSections.map((section, sectionIndex) => (
              <option key={section.id} value={`section:${section.id}`}>
                Ir para: {getSectionLabel(section, sectionIndex)}
              </option>
            ))}

            <option value="submit">Enviar formulário</option>
          </GoToSelect>
        )}

        {isBuilder && (
          <Btn
            title="Remover opção"
            onClick={() => onRemoveOption(index)}
            style={{ width: 44 }}
          >
            -
          </Btn>
        )}
      </OptRow>
    );
  }

  function renderOptions() {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {question.options?.map(renderOptionRow)}

        {isBuilder && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Btn onClick={onAddOption}>+ Opção</Btn>
            {!hasOther && <Btn onClick={onAddOtherOption}>+ Outros</Btn>}
          </div>
        )}
      </div>
    );
  }

  function renderAnswerArea() {
    if (isText) return renderTextInput();
    if (isDate) {
      return question.includeTime
        ? renderDateTimeInput()
        : renderDateOnlyInput();
    }
    if (isOptions) return renderOptions();
    return null;
  }

  const isoDateValue = formatToIsoDate(dateValue);

  return (
    <QuestionShell>
      {isBuilder && (
        <QuestionTop>
          <QuestionMeta>
            <LeftMeta>
              <TypeSelect
                value={question.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="text">Resposta Curta</option>
                <option value="multipleChoice">Múltipla escolha</option>
                <option value="checkbox">Caixas de seleção</option>
                <option value="date">Data</option>
              </TypeSelect>
            </LeftMeta>

            <RightMeta>
              {question.required && <Pill data-req="true">obrigatória</Pill>}
            </RightMeta>
          </QuestionMeta>
        </QuestionTop>
      )}

      {renderQuestionTitle()}

      <div style={{ marginTop: isBuilder ? 10 : 0 }}>
        {renderAnswerArea()}
      </div>

      {isDate && isPreview && !dateError && !!isoDateValue && (
        <input type="hidden" value={isoDateValue} readOnly />
      )}

      {isBuilder && (
        <Footer>
          <IconDangerBtn title="Remover pergunta" onClick={onRemove}>
            <Trash size={18} weight="bold" />
          </IconDangerBtn>

          {isOptions && (
            <ToggleWrap as="label" style={{ cursor: "pointer" }}>
              <ToggleLabel>Tamanho</ToggleLabel>

              <ToggleInput
                type="checkbox"
                checked={!!question.sizeEnabled}
                onChange={() =>
                  onUpdate({ sizeEnabled: !question.sizeEnabled })
                }
              />

              <ToggleSwitch data-on={question.sizeEnabled ? "true" : "false"}>
                <ToggleKnob data-on={question.sizeEnabled ? "true" : "false"} />
              </ToggleSwitch>
            </ToggleWrap>
          )}

          {canHaveJump && (
            <ToggleWrap as="label" style={{ cursor: "pointer" }}>
              <ToggleLabel>Encaminhar</ToggleLabel>

              <ToggleInput
                type="checkbox"
                checked={!!question.jumpEnabled}
                onChange={() => onUpdate({ jumpEnabled: !question.jumpEnabled })}
              />

              <ToggleSwitch data-on={question.jumpEnabled ? "true" : "false"}>
                <ToggleKnob data-on={question.jumpEnabled ? "true" : "false"} />
              </ToggleSwitch>
            </ToggleWrap>
          )}

          {isDate && (
            <ToggleWrap as="label" style={{ cursor: "pointer" }}>
              <ToggleLabel>Incluir hora</ToggleLabel>

              <ToggleInput
                type="checkbox"
                checked={!!question.includeTime}
                onChange={() => onUpdate({ includeTime: !question.includeTime })}
              />

              <ToggleSwitch data-on={question.includeTime ? "true" : "false"}>
                <ToggleKnob data-on={question.includeTime ? "true" : "false"} />
              </ToggleSwitch>
            </ToggleWrap>
          )}

          <ToggleWrap as="label" style={{ cursor: "pointer" }}>
            <ToggleLabel>Obrigatória</ToggleLabel>

            <ToggleInput
              type="checkbox"
              checked={question.required}
              onChange={() => onUpdate({ required: !question.required })}
            />

            <ToggleSwitch data-on={question.required ? "true" : "false"}>
              <ToggleKnob data-on={question.required ? "true" : "false"} />
            </ToggleSwitch>
          </ToggleWrap>
        </Footer>
      )}
    </QuestionShell>
  );
}
import { useEffect, useState } from "react";
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

const DATE_MIN = "1900-01-01";
const DATE_MAX = "2099-12-31";
const MIN_YEAR = 1900;
const MAX_YEAR = 2099;

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

function isValidDateYear(value: string) {
  if (!value) return true;

  const [yearStr, monthStr, dayStr] = value.split("-");
  if (!yearStr || !monthStr || !dayStr) return false;
  if (yearStr.length !== 4) return false;

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }

  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
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

  const isMultipleChoice = question.type === "multipleChoice";
  const isCheckbox = question.type === "checkbox";
  const isOptions = isMultipleChoice || isCheckbox;
  const isDate = question.type === "date";
  const isText = question.type === "text";

  const hasOther = !!question.options?.some((o) => o.isOther);
  const canHaveJump = isBuilder && isMultipleChoice;
  const showJump = isMultipleChoice && !!question.jumpEnabled;

  const availableSections = sections.filter((s) => s.id !== sectionId);

  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    setDateError("");
    setDateValue("");
    setTimeValue("");
  }, [question.id, question.type, question.includeTime]);

  function handleTypeChange(value: string) {
    const nextType = value as QuestionType;

    onUpdate({
      type: nextType,
      ...(nextType !== "date" ? { includeTime: false } : {})
    });
  }

  function handleDateChange(nextValue: string) {
    setDateValue(nextValue);

    if (!nextValue) {
      setDateError("");
      return;
    }

    if (!isValidDateYear(nextValue)) {
      setDateError(`Informe uma data com ano entre ${MIN_YEAR} e ${MAX_YEAR}.`);
      return;
    }

    setDateError("");
  }

  function handleDateBlur() {
    if (!dateValue) {
      setDateError("");
      return;
    }

    if (!isValidDateYear(dateValue)) {
      setDateValue("");
      setDateError(`Informe uma data com ano entre ${MIN_YEAR} e ${MAX_YEAR}.`);
      return;
    }

    setDateError("");
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
      <div style={{ display: "grid", gap: 6 }}>
        <input
          type="date"
          disabled={!isPreview}
          min={DATE_MIN}
          max={DATE_MAX}
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          onBlur={handleDateBlur}
          style={INPUT_LINE_STYLE}
        />

        {!!dateError && (
          <span style={{ fontSize: 12, color: "#d93025" }}>{dateError}</span>
        )}
      </div>
    );
  }

  function renderDateTimeInput() {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: "1 1 220px", minWidth: 180 }}>
            <div style={LABEL_STYLE}>Data</div>
            <input
              type="date"
              disabled={!isPreview}
              min={DATE_MIN}
              max={DATE_MAX}
              value={dateValue}
              onChange={(e) => handleDateChange(e.target.value)}
              onBlur={handleDateBlur}
              style={INPUT_LINE_STYLE}
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

        {!!dateError && (
          <span style={{ fontSize: 12, color: "#d93025" }}>{dateError}</span>
        )}
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

      <div style={{ marginTop: isBuilder ? 10 : 0 }}>{renderAnswerArea()}</div>

      {isBuilder && (
        <Footer>
          <IconDangerBtn title="Remover pergunta" onClick={onRemove}>
            <Trash size={18} weight="bold" />
          </IconDangerBtn>

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
import type { GoTo, QuestionType, Section } from "../types";
import QuestionCard from "./QuestionCard";
import { Trash } from "phosphor-react";

import {
  SectionShell,
  SectionTop,
  SectionBadge,
  SectionRight,
  Field,
  TextArea,
  Helper,
  QuestionsBlock,
  IconDangerBtn,
  GoToSelect
} from "./components.styles";

type Props = {
  section: Section;
  index: number;
  canRemove: boolean;
  active: boolean;

  allSections: Section[];

  onActivate: () => void;
  onRemove: () => void;
  onUpdate: (data: { title?: string; description?: string }) => void;
  onUpdateSectionGoTo: (goTo: GoTo) => void;

  onRemoveQuestion: (questionId: string) => void;

  onUpdateQuestion: (
    questionId: string,
    data: {
      label?: string;
      required?: boolean;
      type?: QuestionType;
      jumpEnabled?: boolean;
    }
  ) => void;

  onAddOption: (questionId: string) => void;
  onAddOtherOption: (questionId: string) => void;

  onUpdateOption: (questionId: string, index: number, value: string) => void;
  onUpdateOptionGoTo: (questionId: string, index: number, goTo: GoTo) => void;
  onRemoveOption: (questionId: string, index: number) => void;
};

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

export default function SectionCard({
  section,
  index,
  active,
  canRemove,
  allSections,
  onActivate,
  onRemove,
  onUpdate,
  onUpdateSectionGoTo,
  onRemoveQuestion,
  onUpdateQuestion,
  onAddOption,
  onAddOtherOption,
  onUpdateOption,
  onUpdateOptionGoTo,
  onRemoveOption
}: Props) {
  const hasQuestions = section.questions.length > 0;

  return (
    <SectionShell data-active={active} onClick={onActivate}>
      <SectionTop>
        <div>
          <SectionBadge>Seção {index + 1}</SectionBadge>
        </div>

        <SectionRight>
          {canRemove && (
            <IconDangerBtn
              title="Remover seção"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash size={18} weight="bold" />
            </IconDangerBtn>
          )}
        </SectionRight>
      </SectionTop>

      <Field
        placeholder="Título da seção"
        value={section.title}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate({ title: e.target.value })}
      />

      <TextArea
        placeholder="Descrição da seção"
        value={section.description}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate({ description: e.target.value })}
      />

      <Helper>Clique na seção para ativar e usar o menu lateral.</Helper>

      <QuestionsBlock>
        {hasQuestions ? (
          section.questions.map((q) => (
            <div key={q.id} onClick={(e) => e.stopPropagation()}>
              <QuestionCard
                mode="builder"
                question={q}
                sectionId={section.id}
                sections={allSections}
                onRemove={() => onRemoveQuestion(q.id)}
                onUpdate={(data) => onUpdateQuestion(q.id, data)}
                onAddOption={() => onAddOption(q.id)}
                onAddOtherOption={() => onAddOtherOption(q.id)}
                onUpdateOption={(optIndex, value) =>
                  onUpdateOption(q.id, optIndex, value)
                }
                onUpdateOptionGoTo={(optIndex, goTo) =>
                  onUpdateOptionGoTo(q.id, optIndex, goTo)
                }
                onRemoveOption={(optIndex) => onRemoveOption(q.id, optIndex)}
              />
            </div>
          ))
        ) : (
          <Helper style={{ marginTop: 10 }}>
            Nenhuma pergunta ainda. Use o menu lateral para adicionar.
          </Helper>
        )}
      </QuestionsBlock>

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Helper style={{ marginTop: 0, fontSize: 13 }}>
          Após esta seção:
        </Helper>

        <GoToSelect
          value={goToKey(section.goTo)}
          onChange={(e) => onUpdateSectionGoTo(parseGoTo(e.currentTarget.value))}
        >
          <option value="next">Continuar para a próxima seção</option>

          {allSections
            .filter((s) => s.id !== section.id)
            .map((s, idx) => (
              <option key={s.id} value={`section:${s.id}`}>
                Ir para a seção {idx + 1} ({s.title?.trim() || `Seção ${idx + 1}`})
              </option>
            ))}

          <option value="submit">Enviar formulário</option>
        </GoToSelect>
      </div>
    </SectionShell>
  );
}
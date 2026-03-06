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
  IconDangerBtn
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

  onRemoveQuestion: (questionId: string) => void;

  onUpdateQuestion: (
    questionId: string,
    data: { label?: string; required?: boolean; type?: QuestionType }
  ) => void;

  onAddOption: (questionId: string) => void;
  onAddOtherOption: (questionId: string) => void;

  onUpdateOption: (questionId: string, index: number, value: string) => void;
  onUpdateOptionGoTo: (questionId: string, index: number, goTo: GoTo) => void;
  onRemoveOption: (questionId: string, index: number) => void;
};

export default function SectionCard({
  section,
  index,
  active,
  canRemove,
  allSections,
  onActivate,
  onRemove,
  onUpdate,
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
    </SectionShell>
  );
}
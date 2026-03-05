import type { GoTo, Mode, QuestionType, Section } from "../types";
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
  mode: Mode;
  section: Section;
  index: number;
  canRemove: boolean;
  active: boolean;

  // ✅ para o dropdown “Ir para” nas opções
  allSections: Section[];

  onActivate: () => void;
  onRemove: () => void;
  onUpdate: (data: { title?: string; description?: string }) => void;

  // Perguntas
  onRemoveQuestion: (questionId: string) => void;
  onUpdateQuestion: (
    questionId: string,
    data: { label?: string; required?: boolean; type?: QuestionType }
  ) => void;

  // Opções
  onAddOption: (questionId: string) => void;
  onAddOtherOption: (questionId: string) => void; // ✅ novo
  onUpdateOption: (questionId: string, index: number, value: string) => void;
  onUpdateOptionGoTo: (questionId: string, index: number, goTo: GoTo) => void; // ✅ novo
  onRemoveOption: (questionId: string, index: number) => void;
};

export default function SectionCard({
  mode,
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
  const isBuilder = mode === "builder";

  return (
    <SectionShell data-active={active} onClick={onActivate}>
      <SectionTop>
        <div>
          <SectionBadge>Seção {index + 1}</SectionBadge>
          {!isBuilder && section.description && <Helper>{section.description}</Helper>}
        </div>

        <SectionRight>
          {isBuilder && canRemove && (
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

      {isBuilder ? (
        <>
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
        </>
      ) : (
        <h3 style={{ margin: "10px 0 0 0" }}>{section.title}</h3>
      )}

      <QuestionsBlock>
        {section.questions.map((q) => (
          <div key={q.id} onClick={(e) => e.stopPropagation()}>
            <QuestionCard
              mode={mode}
              question={q}
              sectionId={section.id}
              sections={allSections}
              onRemove={() => onRemoveQuestion(q.id)}
              onUpdate={(data) => onUpdateQuestion(q.id, data)}
              onAddOption={() => onAddOption(q.id)}
              onAddOtherOption={() => onAddOtherOption(q.id)}
              onUpdateOption={(optIndex, value) => onUpdateOption(q.id, optIndex, value)}
              onUpdateOptionGoTo={(optIndex, goTo) => onUpdateOptionGoTo(q.id, optIndex, goTo)}
              onRemoveOption={(optIndex) => onRemoveOption(q.id, optIndex)}
            />
          </div>
        ))}

        {section.questions.length === 0 && (
          <Helper style={{ marginTop: 10 }}>
            Nenhuma pergunta ainda. Use o menu lateral para adicionar.
          </Helper>
        )}
      </QuestionsBlock>
    </SectionShell>
  );
}
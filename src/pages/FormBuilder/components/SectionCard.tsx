import type { Mode, Section } from "../types";
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

  onActivate: () => void;
  onRemove: () => void;
  onUpdate: (data: { title?: string; description?: string }) => void;

  // Perguntas
  onRemoveQuestion: (questionId: string) => void;
  onUpdateQuestion: (questionId: string, data: { label?: string; required?: boolean }) => void;

  // Opções
  onAddOption: (questionId: string) => void;
  onUpdateOption: (questionId: string, index: number, value: string) => void;
  onRemoveOption: (questionId: string, index: number) => void;
};

export default function SectionCard({
  mode,
  section,
  index,
  active,
  canRemove,
  onActivate,
  onRemove,
  onUpdate,
  onRemoveQuestion,
  onUpdateQuestion,
  onAddOption,
  onUpdateOption,
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
          defaultValue={section.title || ""}
          placeholder="Título da seção"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />

          <TextArea
            placeholder="Descrição da seção"
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
          <QuestionCard
            key={q.id}
            mode={mode}
            question={q}
            onRemove={() => onRemoveQuestion(q.id)}
            onUpdate={(data) => onUpdateQuestion(q.id, data)}
            onAddOption={() => onAddOption(q.id)}
            onUpdateOption={(i, v) => onUpdateOption(q.id, i, v)}
            onRemoveOption={(i) => onRemoveOption(q.id, i)}
          />
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

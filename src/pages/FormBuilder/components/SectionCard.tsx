import type { CSSProperties } from "react";
import type { GoTo, QuestionType, Section } from "../types";
import QuestionCard from "./QuestionCard";
import { Trash, DotsSixVertical } from "phosphor-react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

type MoveDirection = "up" | "down";

type Props = {
  section: Section;
  index: number;
  canRemove: boolean;
  active: boolean;

  allSections: Section[];

  onActivate: () => void;
  onRemove: () => void;
  onMoveQuestion: (questionId: string, direction: MoveDirection) => void;
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
      includeTime?: boolean;
    }
  ) => void;

  onAddOption: (questionId: string) => void;
  onAddOtherOption: (questionId: string) => void;

  onUpdateOption: (questionId: string, index: number, value: string) => void;
  onUpdateOptionGoTo: (questionId: string, index: number, goTo: GoTo) => void;
  onRemoveOption: (questionId: string, index: number) => void;
};

type SortableQuestionItemProps = {
  id: string;
  children: React.ReactNode;
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

function SortableQuestionItem({ id, children }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 3 : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10
        }}
      >
        <button
          type="button"
          aria-label="Arrastar pergunta"
          title="Arrastar pergunta"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            minWidth: 34,
            height: 34,
            marginTop: 8,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "#fff",
            cursor: "grab",
            color: "rgba(0,0,0,0.62)",
            flexShrink: 0
          }}
        >
          <DotsSixVertical size={18} weight="bold" />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}

export default function SectionCard({
  section,
  index,
  active,
  canRemove,
  allSections,
  onActivate,
  onRemove,
  onMoveQuestion,
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 2 : undefined,
    boxShadow: isDragging
      ? "0 18px 40px rgba(0,0,0,0.16)"
      : undefined
  };

  const handleQuestionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = section.questions.findIndex(
      (question) => question.id === active.id
    );
    const newIndex = section.questions.findIndex(
      (question) => question.id === over.id
    );

    if (oldIndex < 0 || newIndex < 0) return;

    if (oldIndex < newIndex) {
      for (let i = oldIndex; i < newIndex; i += 1) {
        onMoveQuestion(String(active.id), "down");
      }
      return;
    }

    for (let i = oldIndex; i > newIndex; i -= 1) {
      onMoveQuestion(String(active.id), "up");
    }
  };

  return (
    <SectionShell
      ref={setNodeRef}
      style={style}
      data-active={active}
      onClick={onActivate}
    >
      <SectionTop>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <button
            type="button"
            aria-label={`Arrastar seção ${index + 1}`}
            title="Arrastar seção"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fff",
              cursor: "grab",
              color: "rgba(0,0,0,0.62)",
              flexShrink: 0
            }}
          >
            <DotsSixVertical size={18} weight="bold" />
          </button>

          <div>
            <SectionBadge>Seção {index + 1}</SectionBadge>
          </div>
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

      <Helper>
        Arraste pelo ícone ao lado do título para reordenar a seção.
      </Helper>

      <QuestionsBlock>
        {hasQuestions ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleQuestionDragEnd}
          >
            <SortableContext
              items={section.questions.map((question) => question.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                {section.questions.map((q) => (
                  <SortableQuestionItem key={q.id} id={q.id}>
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
                      onRemoveOption={(optIndex) =>
                        onRemoveOption(q.id, optIndex)
                      }
                    />
                  </SortableQuestionItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
          onChange={(e) =>
            onUpdateSectionGoTo(parseGoTo(e.currentTarget.value))
          }
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
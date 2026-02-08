import { PencilSimple, ListChecks, CheckSquare, Calendar, Plus } from "phosphor-react";
import type { QuestionType } from "../types";
import { Bar, Action, Divider } from "./components.styles";

type Props = {
  canShow: boolean;
  onAddSection: () => void;
  onAddQuestion: (type: QuestionType) => void;
};

export default function SideToolbar({ canShow, onAddSection, onAddQuestion }: Props) {
  if (!canShow) return null;

  return (
    <Bar>
      <Action title="Adicionar pergunta de texto" onClick={() => onAddQuestion("text")}>
        <PencilSimple size={20} weight="bold" />
      </Action>

      <Action title="Adicionar múltipla escolha" onClick={() => onAddQuestion("multipleChoice")}>
        <ListChecks size={20} weight="bold" />
      </Action>

      <Action title="Adicionar checkbox" onClick={() => onAddQuestion("checkbox")}>
        <CheckSquare size={20} weight="bold" />
      </Action>

      <Action title="Adicionar data" onClick={() => onAddQuestion("date")}>
        <Calendar size={20} weight="bold" />
      </Action>

      <Divider />

      <Action title="Nova seção" onClick={onAddSection}>
        <Plus size={20} weight="bold" />
      </Action>
    </Bar>
  );
}

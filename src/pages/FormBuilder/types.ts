export type Mode = "builder" | "preview";
export type QuestionType = "text" | "multipleChoice" | "checkbox" | "date";

/** Regra de navegação por opção (estilo Google Forms) */
export type GoTo =
  | { kind: "next" }                          // próxima seção (padrão)
  | { kind: "section"; sectionId: string }    // ir para uma seção específica
  | { kind: "submit" };                       // enviar / finalizar

export type Option = {
  id: string;
  label: string;
  isOther?: boolean; // 👈 marca “Outros”
  goTo?: GoTo;       // 👈 pular seções por opção
};

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: Option[];
  jumpEnabled?: boolean;
};

export type Section = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};

export type FormDefinition = {
  id: string;
  title: string;
  sections: Section[];
};

export const createId = () => crypto.randomUUID();

export const createOption = (label: string, extra?: Partial<Option>): Option => ({
  id: createId(),
  label,
  ...extra
});

export const createQuestion = (type: QuestionType): Question => {
  const isOptions = type === "multipleChoice" || type === "checkbox";

  return {
    id: createId(),
    type,
    label: "",
    required: false,
    options: isOptions ? [createOption("Opção 1")] : undefined,
    jumpEnabled: type === "multipleChoice" ? false : undefined
  };
};

export const createEmptyForm = (): FormDefinition => {
  const firstSectionId = createId();

  return {
    id: createId(),
    title: "Novo formulário",
    sections: [
      {
        id: firstSectionId,
        title: "",
        description: "",
        questions: []
      }
    ]
  };
};
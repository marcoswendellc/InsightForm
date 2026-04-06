export type Mode = "builder" | "preview" | "respond";

export type QuestionType = "text" | "multipleChoice" | "checkbox" | "date";

/** Regra de navegação (estilo Google Forms) */
export type GoTo =
  | { kind: "next" }
  | { kind: "section"; sectionId: string }
  | { kind: "submit" };

export type SizeUnit = "cm" | "m";

export type SizeValue = {
  width?: string;
  height?: string;
  unit?: SizeUnit;
};

export type Option = {
  id: string;
  label: string;
  isOther?: boolean;
  goTo?: GoTo;
};

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: Option[];
  jumpEnabled?: boolean;
  includeTime?: boolean;
  sizeEnabled?: boolean;
};

export type Section = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  goTo?: GoTo;
};

export type FormDefinition = {
  id: string;
  title: string;
  sections: Section[];
};

/** Respostas do usuário por pergunta */
export type FormAnswers = Record<string, string | string[]>;

export const createId = () => crypto.randomUUID();

export const createOption = (
  label: string,
  extra?: Partial<Option>
): Option => ({
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
    jumpEnabled: type === "multipleChoice" ? false : undefined,
    includeTime: type === "date" ? false : undefined,
    sizeEnabled: isOptions ? false : undefined
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
        questions: [],
        goTo: { kind: "next" }
      }
    ]
  };
};
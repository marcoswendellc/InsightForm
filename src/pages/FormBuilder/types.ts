export type Mode = "builder" | "preview";
export type QuestionType = "text" | "multipleChoice" | "checkbox" | "date";

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // somente quando type != text/date
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

export const createQuestion = (type: QuestionType): Question => {
  return {
    id: createId(),
    type,
    label: "",
    required: false,
    options: type === "multipleChoice" || type === "checkbox" ? ["Opção 1"] : undefined
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

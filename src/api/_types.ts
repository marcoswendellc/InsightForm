export type QuestionType = "text" | "date" | "multipleChoice" | "checkbox";

export type FormPayload = {
  id?: string;      // se vier, atualiza; se não, cria
  title: string;
  sections: Array<{
    id?: string;
    title: string;
    description: string;
    questions: Array<{
      id?: string;
      type: QuestionType;
      label: string;
      required: boolean;
      options?: string[]; // só para multipleChoice/checkbox
    }>;
  }>;
};

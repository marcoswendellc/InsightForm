import type { Question, Section, FormAnswerValue } from "../types";
import QuestionPreview from "./QuestionPreview";
import type { AnswersMap, ErrorsMap } from "./formFlow";
import {
  PreviewSectionShell,
  PreviewSectionHeader,
  PreviewSectionTitle,
  PreviewSectionDescription,
  PreviewQuestionsBlock
} from "./preview.styles";

type Props = {
  section: Section;
  index: number;
  answers: AnswersMap;
  errors: ErrorsMap;
  onAnswerChange: (question: Question, value: FormAnswerValue) => void;
};

export default function SectionPreview({
  section,
  index,
  answers,
  errors,
  onAnswerChange
}: Props) {
  const title = section.title?.trim() || `Seção ${index + 1}`;

  return (
    <PreviewSectionShell>
      <PreviewSectionHeader>
        <PreviewSectionTitle>{title}</PreviewSectionTitle>

        {section.description?.trim() && (
          <PreviewSectionDescription>
            {section.description}
          </PreviewSectionDescription>
        )}
      </PreviewSectionHeader>

      <PreviewQuestionsBlock>
        {section.questions.length > 0 ? (
          section.questions.map((question) => (
            <QuestionPreview
              key={question.id}
              question={question}
              value={answers[question.id]}
              error={errors[question.id]}
              onChange={(value) => onAnswerChange(question, value)}
            />
          ))
        ) : (
          <PreviewSectionDescription>
            Esta seção ainda não possui perguntas.
          </PreviewSectionDescription>
        )}
      </PreviewQuestionsBlock>
    </PreviewSectionShell>
  );
}
import type { Section } from "../types";
import QuestionPreview from "./QuestionPreview";
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
};

export default function SectionPreview({ section, index }: Props) {
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
            <QuestionPreview key={question.id} question={question} />
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
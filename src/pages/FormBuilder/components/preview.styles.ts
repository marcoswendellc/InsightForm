import styled from "styled-components";

export const PreviewSectionShell = styled.section`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

export const PreviewSectionHeader = styled.div`
  margin-bottom: 8px;
`;

export const PreviewSectionTitle = styled.h2`
  margin: 10px 0 0 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: #0f172a;
`;

export const PreviewSectionDescription = styled.p`
  margin: 10px 0 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: #5f6368;
`;

export const PreviewQuestionsBlock = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const PreviewQuestionShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 12px 0;

  &[data-error="true"] {
    border-left: 4px solid #d93025;
    padding-left: 12px;
  }

  &:first-child {
    padding-top: 0;
  }
`;

export const PreviewQuestionLabel = styled.div`
  font-size: 17px;
  font-weight: 700;
  line-height: 1.45;
  color: #202124;
  margin-bottom: 6px;
`;

export const RequiredMark = styled.span`
  color: #d93025;
  margin-left: 4px;
`;

export const PreviewTextInput = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1px solid #dadce0;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  color: #202124;
  outline: none;

  &[data-error="true"] {
    border-bottom: 2px solid #d93025;
  }

  &:focus {
    border-bottom: 2px solid #ed1c24;
  }

  &::placeholder {
    color: #5f6368;
  }
`;

export const PreviewDateInput = styled(PreviewTextInput)``;

export const PreviewOptionsList = styled.div`
  display: grid;
  gap: 12px;
`;

export const PreviewOptionCard = styled.div<{ $checked?: boolean }>`
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid ${({ $checked }) => ($checked ? "#f3b4b4" : "#e5e7eb")};
  border-radius: 16px;
  background: ${({ $checked }) => ($checked ? "#fffafa" : "#fff")};
  transition: all 0.2s ease;
  align-items: flex-start;
`;

export const PreviewOptionRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #202124;
  cursor: pointer;
`;

export const PreviewOptionText = styled.span`
  font-size: 14px;
  line-height: 1.45;
`;

export const PreviewOtherInput = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1px solid #dadce0;
  background: transparent;
  padding: 6px 0;
  font-size: 14px;
  color: #202124;
  outline: none;

  &:focus {
    border-bottom: 2px solid #ed1c24;
  }

  &::placeholder {
    color: #5f6368;
  }
`;

export const PreviewSizeBlock = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 4px;
  padding-left: 28px;
`;

export const PreviewSizeRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

export const PreviewSizeField = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const PreviewSizeFieldLabel = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #5f6368;
  min-width: 50px;
`;

export const PreviewSizeInput = styled.input`
  width: 130px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  font-size: 15px;
  color: #202124;
  outline: none;

  &:focus {
    border-color: #ed1c24;
  }
`;

export const PreviewSizeSelect = styled.select`
  width: 150px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  font-size: 15px;
  color: #202124;
  outline: none;

  &:focus {
    border-color: #ed1c24;
  }
`;

export const PreviewSizeHint = styled.div`
  width: 100%;
  padding-left: 28px;
  margin-top: -2px;
  font-size: 12px;
  color: #6b7280;
`;

export const PreviewErrorText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #d93025;
`;
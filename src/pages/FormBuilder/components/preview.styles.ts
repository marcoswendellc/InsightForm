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
  gap: 14px;
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
    border-bottom: 2px solid #673ab7;
  }

  &::placeholder {
    color: #5f6368;
  }
`;

export const PreviewDateInput = styled.input`
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
    border-bottom: 2px solid #673ab7;
  }
`;

export const PreviewOptionsList = styled.div`
  display: grid;
  gap: 12px;
`;

export const PreviewOptionRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #202124;
  cursor: pointer;
`;

export const PreviewOtherWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

export const PreviewOtherInput = styled.input`
  flex: 1;
  border: none;
  border-bottom: 1px solid #dadce0;
  background: transparent;
  padding: 6px 0;
  font-size: 14px;
  color: #202124;
  outline: none;

  &:focus {
    border-bottom: 2px solid #673ab7;
  }

  &::placeholder {
    color: #5f6368;
  }
`;

export const PreviewErrorText = styled.div`
  margin-top: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #d93025;
`;

export const PreviewDateTimeRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

export const PreviewDateTimeField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 220px;
  min-width: 160px;
`;

export const PreviewDateTimeLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
`;

export const PreviewSizeBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
`;

export const PreviewSizeHint = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

export const PreviewSizeFieldLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
`;

export const PreviewSizeInput = styled.input`
  width: 100%;
  max-width: 180px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  font-size: 14px;
  color: #202124;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #ed1c24;
  }

  &::placeholder {
    color: #5f6368;
  }
`;

export const PreviewSizeSelect = styled.select`
  width: 100%;
  max-width: 120px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  font-size: 14px;
  color: #202124;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #ed1c24;
  }
`;
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
  font-size: 24px;
  font-weight: 500;
  line-height: 1.3;
  color: #202124;
`;

export const PreviewSectionDescription = styled.p`
  margin: 10px 0 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: #5f6368;
`;

export const PreviewQuestionsBlock = styled.div`
  margin-top: 24px;
`;

export const PreviewQuestionShell = styled.div`
  padding: 18px 0;

  &:first-child {
    padding-top: 0;
  }
`;

export const PreviewQuestionLabel = styled.div`
  font-size: 16px;
  font-weight: 400;
  line-height: 1.45;
  color: #202124;
  margin-bottom: 14px;
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
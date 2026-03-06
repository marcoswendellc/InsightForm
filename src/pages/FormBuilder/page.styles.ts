import styled from "styled-components";

export const Page = styled.div`
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: #f4f6f8;
  transition: background 0.2s ease;

  &[data-preview="true"] {
    background: #f0ebf8;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const Center = styled.div`
  max-width: 980px;
  margin: 0 auto;

  &[data-preview="true"] {
    max-width: 760px;
  }
`;

export const Header = styled.header`
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;

  display: flex;
  align-items: center;
  gap: 16px;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TitleInput = styled.input`
  width: 100%;
  border: none;
  outline: none;

  font-size: 20px;
  font-weight: 700;
  background: transparent;
  color: #202124;

  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    opacity: 1;
    cursor: default;
  }
`;

export const Subtle = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.4;
`;

export const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-shrink: 0;
`;

export const IconBtn = styled.button`
  width: 42px;
  height: 42px;

  border-radius: 12px;
  border: none;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.06);
  color: #333;

  transition: all 0.2s ease;

  &[data-active="true"] {
    background: rgba(103, 58, 183, 0.14);
    color: #673ab7;
  }

  &:hover {
    background: rgba(103, 58, 183, 0.12);
    color: #673ab7;
    transform: scale(1.05);
  }
`;

export const Body = styled.div`
  margin-top: 20px;

  display: flex;
  flex-direction: column;
  gap: 16px;

  &[data-preview="true"] {
    gap: 12px;
  }
`;
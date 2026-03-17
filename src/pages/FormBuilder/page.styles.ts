import styled from "styled-components";

const colors = {
  primary: "#ED1C24",
  primarySoft: "#FDECEC",
  text: "#1F2A37",
  textSoft: "#6B7280",
  border: "#E5E7EB",
  bg: "#F7F8FA",
  white: "#FFFFFF",
  muted: "#F3F4F6",
};

export const Page = styled.div`
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: ${colors.bg};
  transition: background 0.2s ease;

  &[data-preview="true"] {
    background: ${colors.bg};
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const Center = styled.div`
  max-width: 1080px;
  margin: 0 auto;

  &[data-preview="true"] {
    max-width: 860px;
  }
`;

export const Header = styled.header`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 18px;
  padding: 18px 20px;

  display: flex;
  align-items: center;
  gap: 16px;

  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TitleInput = styled.input`
  width: 100%;
  border: none;
  outline: none;

  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  background: transparent;
  color: ${colors.text};

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 1;
    cursor: default;
  }
`;

export const Subtle = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: ${colors.textSoft};
  line-height: 1.45;
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

  background: ${colors.muted};
  color: ${colors.textSoft};

  transition: all 0.2s ease;

  &[data-active="true"] {
    background: ${colors.primarySoft};
    color: ${colors.primary};
  }

  &:hover:not(:disabled) {
    background: ${colors.primarySoft};
    color: ${colors.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const Body = styled.div`
  margin-top: 24px;

  display: flex;
  flex-direction: column;
  gap: 18px;

  &[data-preview="true"] {
    gap: 14px;
  }
`;
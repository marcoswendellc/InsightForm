import styled from "styled-components";

const colors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  primarySoft: "#FDECEC",
  text: "#1F2A37",
  textSoft: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  muted: "#F3F4F6",
  danger: "#B91C1C",
  dangerSoft: "rgba(220, 38, 38, 0.10)",
};

export const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
  background:
    radial-gradient(circle at top, rgba(237, 28, 36, 0.16), transparent 38%),
    linear-gradient(180deg, #f7f8fa 0%, #f3f4f6 100%);
`;

export const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 28px 24px;
  border-radius: 22px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
`;

export const Title = styled.div`
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  color: ${colors.text};
`;

export const Subtitle = styled.div`
  margin-top: 8px;
  color: ${colors.textSoft};
  font-size: 14px;
  line-height: 1.45;
`;

export const Field = styled.input`
  width: 100%;
  margin-top: 14px;
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 15px;
  color: ${colors.text};
  background: ${colors.white};

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(237, 28, 36, 0.08);
  }
`;

export const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;

export const Btn = styled.button`
  border: none;
  cursor: pointer;
  font-weight: 800;
  font-size: 15px;
  color: #fff;
  background: ${colors.primary};
  padding: 14px 18px;
  border-radius: 14px;
  min-width: 120px;
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Hint = styled.div`
  margin-top: 12px;
  font-size: 12px;
  color: ${colors.textSoft};
  line-height: 1.45;

  &[data-err="true"] {
    color: ${colors.danger};
    background: ${colors.dangerSoft};
    padding: 10px 12px;
    border-radius: 12px;
  }
`;
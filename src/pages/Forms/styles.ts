import styled from "styled-components";

const colors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  primarySoft: "#FDECEC",
  text: "#1F2A37",
  textSoft: "#6B7280",
  border: "#E5E7EB",
  borderSoft: "#EEF0F3",
  bg: "#F7F8FA",
  white: "#FFFFFF",
  muted: "#F3F4F6",
};

export const Card = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 20px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);

  @media (max-width: 768px) {
    padding: 18px;
    border-radius: 16px;
  }
`;

export const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Title = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: ${colors.text};
  line-height: 1.2;
`;

export const Hint = styled.div`
  margin-top: 6px;
  color: ${colors.textSoft};
  font-size: 13px;
  line-height: 1.45;
`;

export const Input = styled.input`
  width: 100%;
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

  &:disabled {
    background: ${colors.muted};
    color: ${colors.text};
    cursor: default;
  }
`;

export const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`;

export const IconBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid ${colors.border};
  background: ${colors.muted};
  color: ${colors.textSoft};
  cursor: pointer;

  display: grid;
  place-items: center;

  transition: all 0.18s ease;

  &:hover {
    background: ${colors.primarySoft};
    border-color: rgba(237, 28, 36, 0.18);
    color: ${colors.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

export const GoToSelect = styled.select`
  height: 40px;
  border: 1px solid ${colors.border};
  background: ${colors.white};
  border-radius: 12px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: ${colors.text};
  outline: none;
  cursor: pointer;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(237, 28, 36, 0.08);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: ${colors.muted};
  }
`;
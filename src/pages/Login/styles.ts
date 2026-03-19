import styled from "styled-components";

const colors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  text: "#1F2937",
  textSoft: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  white: "#FFFFFF",
  bg: "#F7F7F8",
  danger: "#B91C1C",
  dangerSoft: "rgba(220, 38, 38, 0.10)"
};

export const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: ${colors.bg};
`;

export const Shell = styled.div`
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Brand = styled.div`
  margin-bottom: 28px;
`;

export const BrandMark = styled.div`
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: ${colors.primary};
`;

export const HeaderBlock = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 48px;
  line-height: 1.05;
  font-weight: 800;
  color: ${colors.text};

  @media (max-width: 640px) {
    font-size: 38px;
  }
`;

export const Subtitle = styled.p`
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: ${colors.textSoft};
`;

export const Form = styled.form`
  width: 100%;
`;

export const FieldGroup = styled.div`
  width: 100%;
  margin-bottom: 22px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 700;
  color: ${colors.text};
`;

export const Field = styled.input`
  width: 100%;
  height: 56px;
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 0 16px;
  font-size: 18px;
  color: ${colors.text};
  background: ${colors.white};
  box-sizing: border-box;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &::placeholder {
    color: ${colors.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(237, 28, 36, 0.08);
  }

  &:disabled {
    background: #fafafa;
    cursor: not-allowed;
  }
`;

export const Btn = styled.button`
  width: 100%;
  height: 54px;
  margin-top: 4px;
  border: none;
  border-radius: 14px;
  background: ${colors.primary};
  color: ${colors.white};
  font-size: 22px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;

  &:hover:not(:disabled) {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Hint = styled.div`
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.45;
  color: ${colors.textSoft};

  &[data-err="true"] {
    color: ${colors.danger};
    background: ${colors.dangerSoft};
    padding: 10px 12px;
    border-radius: 12px;
  }
`;

export const Footer = styled.div`
  margin-top: 36px;
  font-size: 14px;
  color: ${colors.textSoft};
  text-align: center;
`;
import styled, { keyframes } from "styled-components";

const colors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  text: "#1F2937",
  textStrong: "#162338",
  textSoft: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#D9DEE7",
  white: "#FFFFFF",
  bg: "#F4F4F6",
  inputBg: "#FFFFFF",
  danger: "#B42318",
  dangerSoft: "rgba(180, 35, 24, 0.10)"
};

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: ${colors.bg};
`;

export const Shell = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeUp} 0.35s ease;
`;

export const Brand = styled.div`
  margin-bottom: 26px;
  display: flex;
  justify-content: center;
`;

export const Logo = styled.img`
  height: 58px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06));

  @media (max-width: 640px) {
    height: 50px;
  }
`;

export const HeaderBlock = styled.div`
  text-align: center;
  margin-bottom: 34px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 40px;
  line-height: 1.05;
  font-weight: 800;
  color: ${colors.textStrong};

  @media (max-width: 640px) {
    font-size: 34px;
  }
`;

export const Subtitle = styled.p`
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.45;
  color: ${colors.textSoft};
`;

export const Form = styled.form`
  width: 100%;
`;

export const FieldGroup = styled.div`
  width: 100%;
  margin-bottom: 18px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 800;
  color: ${colors.textStrong};
`;

export const Field = styled.input`
  width: 100%;
  height: 60px;
  border: 1px solid ${colors.border};
  border-radius: 18px;
  padding: 0 18px;
  font-size: 18px;
  color: ${colors.text};
  background: ${colors.inputBg};
  box-sizing: border-box;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;

  &::placeholder {
    color: ${colors.textMuted};
  }

  &:hover:not(:disabled) {
    border-color: #c8d0dc;
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 4px rgba(237, 28, 36, 0.08);
    transform: translateY(-1px);
  }

  &:disabled {
    background: #fafafa;
    cursor: not-allowed;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: ${colors.text};
    box-shadow: 0 0 0 1000px ${colors.white} inset;
    transition: background-color 9999s ease-in-out 0s;
  }
`;

export const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 18px;
`;

export const SecondaryAction = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${colors.textSoft};
  cursor: pointer;
  transition: color 0.18s ease;

  &:hover {
    color: ${colors.primary};
  }
`;

export const Hint = styled.div`
  margin-bottom: 18px;
  font-size: 13px;
  line-height: 1.45;
  color: ${colors.textSoft};

  &[data-err="true"] {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: ${colors.danger};
    background: ${colors.dangerSoft};
    padding: 12px 14px;
    border-radius: 14px;
  }
`;

export const ErrorIcon = styled.span`
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 1.4;
`;

export const Btn = styled.button`
  width: 100%;
  height: 58px;
  border: none;
  border-radius: 18px;
  background: ${colors.primary};
  color: ${colors.white};
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover:not(:disabled) {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(237, 28, 36, 0.18);
  }

  &:active:not(:disabled) {
    transform: scale(0.985);
  }

  &:disabled {
    opacity: 0.78;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const Spinner = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: ${spin} 0.7s linear infinite;
`;

export const Footer = styled.div`
  margin-top: 42px;
  font-size: 14px;
  color: ${colors.textSoft};
  text-align: center;
`;
export const FormCard = styled.div`
  width: 100%;
  padding: 26px 22px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
`;
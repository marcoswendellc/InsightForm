import styled from "styled-components";

const colors = {
  primary: "#ED1C24",
  primaryHover: "#D71920",
  primarySoft: "#FDECEC",
  text: "#1F2A37",
  textSoft: "#6B7280",
  border: "#E5E7EB",
  borderSoft: "#EEF0F3",
  bg: "#F6F7F9",
  white: "#FFFFFF",
  muted: "#F3F4F6",
  danger: "#DC2626",
};

export const Bar = styled.aside`
  position: fixed;
  right: 24px;
  top: 140px;
  z-index: 20;

  display: flex;
  flex-direction: column;
  gap: 10px;

  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 12px;

  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
`;

export const Action = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  cursor: pointer;

  display: grid;
  place-items: center;

  background: ${colors.muted};
  color: ${colors.textSoft};

  transition: all 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${colors.primarySoft};
    color: ${colors.primary};
  }
`;

export const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${colors.border};
`;

export const SectionShell = styled.section`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 24px;

  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &[data-active="true"] {
    border-color: ${colors.primary};
    box-shadow: 0 6px 18px rgba(237, 28, 36, 0.08);
  }
`;

export const SectionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

export const SectionBadge = styled.div`
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: ${colors.textSoft};
  text-transform: uppercase;
`;

export const SectionRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DangerBtn = styled.button`
  border: none;
  cursor: pointer;
  border-radius: 12px;
  padding: 10px 12px;

  background: rgba(220, 38, 38, 0.08);
  color: ${colors.danger};
  font-weight: 700;

  transition: all 0.18s ease;

  &:hover {
    background: rgba(220, 38, 38, 0.14);
  }
`;

export const Field = styled.input`
  width: 100%;
  margin-top: 10px;
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 15px;
  color: ${colors.text};
  background: ${colors.white};

  &::placeholder {
    color: ${colors.textSoft};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(237, 28, 36, 0.08);
  }

  &:disabled {
    background: ${colors.muted};
    color: ${colors.text};
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  margin-top: 10px;
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 14px 16px;
  resize: vertical;
  min-height: 100px;
  font-size: 15px;
  color: ${colors.text};
  background: ${colors.white};

  &::placeholder {
    color: ${colors.textSoft};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px rgba(237, 28, 36, 0.08);
  }

  &:disabled {
    background: ${colors.muted};
    color: ${colors.text};
  }
`;

export const Helper = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: ${colors.textSoft};
  line-height: 1.5;
`;

export const QuestionShell = styled.div`
  margin-top: 22px;
  border: 1px solid ${colors.borderSoft};
  border-radius: 16px;
  padding: 18px;
  background: ${colors.white};
`;

export const QuestionTop = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

export const QuestionMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
`;

export const LeftMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

export const RightMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Pill = styled.span`
  font-size: 12px;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${colors.muted};
  color: ${colors.textSoft};

  display: inline-flex;
  align-items: center;
  justify-content: flex-start;

  &[data-req="true"] {
    background: ${colors.primarySoft};
    color: ${colors.primary};
  }
`;

export const OptRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;

export const OptInput = styled.input`
  flex: 1;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  background: ${colors.white};
  color: ${colors.text};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }

  &:disabled {
    background: transparent;
    border: none;
    padding: 0;
    border-radius: 0;
    color: ${colors.text};
  }
`;

export const Btn = styled.button`
  border: none;
  cursor: pointer;
  border-radius: 14px;
  padding: 12px 16px;

  background: ${colors.muted};
  color: ${colors.text};
  font-weight: 700;

  transition: all 0.18s ease;

  &:hover {
    background: ${colors.primarySoft};
    color: ${colors.primary};
  }
`;

export const MiniBtn = styled.button`
  border: none;
  cursor: pointer;
  border-radius: 12px;
  padding: 8px 10px;

  background: ${colors.muted};
  color: ${colors.text};
  font-weight: 700;

  &[data-danger="true"] {
    background: rgba(220, 38, 38, 0.08);
    color: ${colors.danger};
  }
`;

export const Footer = styled.div`
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid ${colors.border};

  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
`;

export const FooterSpacer = styled.div`
  flex: 1;
`;

export const IconDangerBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  cursor: pointer;

  display: grid;
  place-items: center;

  background: rgba(220, 38, 38, 0.08);
  color: ${colors.danger};

  transition: all 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(220, 38, 38, 0.14);
  }
`;

export const ToggleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ToggleLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSoft};
  font-weight: 600;
`;

export const ToggleInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
`;

export const ToggleSwitch = styled.div`
  width: 46px;
  height: 26px;
  border-radius: 999px;
  position: relative;

  background: #d1d5db;
  transition: background 0.2s ease;

  &[data-on="true"] {
    background: rgba(237, 28, 36, 0.45);
  }
`;

export const ToggleKnob = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;

  transition: transform 0.2s ease;

  &[data-on="true"] {
    transform: translateX(20px);
  }
`;

export const QuestionsBlock = styled.div`
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid ${colors.border};
`;

export const TypeSelect = styled.select`
  border: 1px solid ${colors.border};
  background: ${colors.white};
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  color: ${colors.text};
  outline: none;
  cursor: pointer;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  &:focus {
    border-color: ${colors.primary};
  }
`;

export const GoToSelect = styled.select`
  height: 36px;
  border: 1px solid ${colors.border};
  background: ${colors.white};
  border-radius: 12px;
  padding: 0 10px;
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
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const OtherInput = styled.input`
  flex: 1;
  border: none;
  border-bottom: 1px solid #c7cdd4;
  background: transparent;
  padding: 6px 4px;
  outline: none;
  font-size: 14px;
  color: ${colors.text};

  &:disabled {
    opacity: 1;
  }

  &:focus {
    border-bottom-color: ${colors.primary};
  }
`;
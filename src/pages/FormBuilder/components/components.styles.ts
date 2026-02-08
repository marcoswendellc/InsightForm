import styled from "styled-components";

export const Bar = styled.aside`
  position: fixed;
  right: 24px;
  top: 140px;
  z-index: 20;

  display: flex;
  flex-direction: column;
  gap: 10px;

  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 18px;
  padding: 12px;

  box-shadow: 0 30px 80px rgba(0,0,0,0.22);
  backdrop-filter: blur(10px);
`;

export const Action = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 16px;
  border: none;
  cursor: pointer;

  display: grid;
  place-items: center;

  background: rgba(0,0,0,0.06);

  transition: transform .15s ease, background .15s ease;

  &:hover{
    transform: scale(1.06);
    background: rgba(0,94,255,0.14);
    color: #005eff;
  }
`;

export const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: rgba(0,0,0,0.12);
`;

/* ====== SECTION ====== */

export const SectionShell = styled.section`
  background: rgba(255,255,255,0.92);
  border: 2px solid transparent;
  border-radius: 18px;
  padding: 16px;

  box-shadow: 0 30px 80px rgba(0,0,0,0.22);
  backdrop-filter: blur(10px);

  &[data-active="true"]{
    border-color: rgba(0,94,255,0.65);
  }
`;

export const SectionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

export const SectionBadge = styled.div`
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.2px;
  color: rgba(0,0,0,0.70);
`;

export const SectionRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DangerBtn = styled.button`
  border: none;
  cursor: pointer;
  border-radius: 14px;
  padding: 10px 12px;

  background: rgba(220,38,38,0.12);
  color: #dc2626;
  font-weight: 900;
`;

/* ====== FORM FIELDS ====== */

export const Field = styled.input`
  width: 100%;
  margin-top: 10px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 14px;
  padding: 12px 12px;

  &:focus{
    outline: none;
    border-color: #005eff;
  }

  &:disabled{
    background: #f5f5f5;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  margin-top: 10px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 14px;
  padding: 12px 12px;
  resize: vertical;
  min-height: 44px;

  &:focus{
    outline: none;
    border-color: #005eff;
  }
`;

export const Helper = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0,0,0,0.60);
`;

/* ====== QUESTION ====== */

export const QuestionShell = styled.div`
  margin-top: 22px;
  border: 1px solid rgba(0,0,0,0.10);
  border-radius: 16px;
  padding: 12px;
  background: #fff;
`;

export const QuestionTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Pill = styled.span`
  font-size: 12px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0,0,0,0.06);

  &[data-req="true"]{
    background: rgba(0,94,255,0.14);
    color: #005eff;
  }
`;

export const OptRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

export const OptInput = styled.input`
  flex: 1;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  padding: 10px 12px;

  &:disabled{
    background: #f5f5f5;
  }
`;

export const Btn = styled.button`
  border: none;
  cursor: pointer;
  border-radius: 14px;
  padding: 10px 12px;

  background: rgba(0,0,0,0.06);
  font-weight: 900;

  &:hover{
    background: rgba(0,94,255,0.12);
    color: #005eff;
  }
`;

export const MiniBtn = styled.button`
  border: none;
  cursor: pointer;
  border-radius: 12px;
  padding: 8px 10px;

  background: rgba(0,0,0,0.06);
  font-weight: 900;

  &[data-danger="true"]{
    background: rgba(220,38,38,0.12);
    color: #dc2626;
  }
`;
export const Footer = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.08);

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

  background: rgba(220,38,38,0.12);
  color: #dc2626;

  transition: transform .15s ease, background .15s ease;

  &:hover {
    transform: scale(1.06);
    background: rgba(220,38,38,0.18);
  }
`;

export const ToggleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ToggleLabel = styled.div`
  font-size: 13px;
  color: rgba(0,0,0,0.70);
  font-weight: 600;
`;

/* input invisível que controla o toggle */
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

  background: rgba(0,0,0,0.18);
  transition: background .2s ease;

  &[data-on="true"]{
    background: rgba(124,58,237,0.65); /* roxinho estilo Forms */
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

  transition: transform .2s ease;

  &[data-on="true"]{
    transform: translateX(20px);
  }
`;

export const QuestionsBlock = styled.div`
  margin-top: 28px;              /* 👈 respiro claro após descrição */
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.08);
`;


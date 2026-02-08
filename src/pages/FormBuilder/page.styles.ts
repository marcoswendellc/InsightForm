import styled from "styled-components";

/* =========================
   LAYOUT GERAL
========================= */

export const Page = styled.div`
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: #f4f6f8;
`;

export const Center = styled.div`
  max-width: 980px;
  margin: 0 auto;
`;

/* =========================
   HEADER
========================= */

export const Header = styled.header`
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;

  display: flex;
  align-items: center;
  gap: 16px;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
`;

export const TitleInput = styled.input`
  width: 100%;
  border: none;
  outline: none;

  font-size: 20px;
  font-weight: 700;
  background: transparent;

  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Subtle = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
`;

/* =========================
   AÇÕES
========================= */

export const Actions = styled.div`
  display: flex;
  gap: 10px;
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
    background: rgba(0, 94, 255, 0.15);
    color: #005eff;
  }

  &:hover {
    background: rgba(0, 94, 255, 0.12);
    color: #005eff;
    transform: scale(1.05);
  }
`;

/* =========================
   BODY
========================= */

export const Body = styled.div`
  margin-top: 20px;

  display: flex;
  flex-direction: column;
  gap: 16px;
`;

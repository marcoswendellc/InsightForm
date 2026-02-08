import styled from "styled-components";

export const Card = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 30px 80px rgba(0,0,0,0.25);
`;

export const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;
`;

export const Title = styled.div`
  font-size: 20px;
  font-weight: 900;
`;

export const Hint = styled.div`
  margin-top: 6px;
  color: rgba(0,0,0,0.65);
  font-size: 13px;
`;

export const Input = styled.input`
  width: 100%;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 14px;
  padding: 12px 12px;

  &:focus { outline: none; border-color: #005eff; }
`;

export const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

export const IconBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.10);
  background: rgba(0,0,0,0.04);
  cursor: pointer;

  display: grid;
  place-items: center;

  &:hover{
    background: rgba(0,94,255,0.12);
    border-color: rgba(0,94,255,0.25);
    color: #005eff;
  }
`;

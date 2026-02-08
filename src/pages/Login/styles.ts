import styled from "styled-components";

export const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
  background:
    radial-gradient(1200px 800px at 20% -10%, rgba(0,94,255,0.45), transparent 55%),
    radial-gradient(1000px 800px at 110% 0%, rgba(255,92,0,0.20), transparent 55%),
    #0b0f1a;
`;

export const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
`;

export const Title = styled.div`
  font-size: 22px;
  font-weight: 900;
`;

export const Subtitle = styled.div`
  margin-top: 6px;
  color: rgba(0,0,0,0.65);
`;

export const Field = styled.input`
  width: 100%;
  margin-top: 12px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 14px;
  padding: 12px 12px;

  &:focus { outline: none; border-color: #005eff; }
`;

export const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
`;

export const Btn = styled.button`
  border: none;
  cursor: pointer;
  font-weight: 900;
  color: #fff;
  background: #005eff;
  padding: 12px 14px;
  border-radius: 14px;
`;

export const Hint = styled.div`
  margin-top: 12px;
  font-size: 12px;
  color: rgba(0,0,0,0.65);

  &[data-err="true"]{
    color: #b91c1c;
    background: rgba(220,38,38,0.10);
    padding: 10px 12px;
    border-radius: 12px;
  }
`;

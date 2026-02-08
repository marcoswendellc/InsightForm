import styled from "styled-components";

export const Layout = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(1200px 800px at 20% -10%, rgba(0,94,255,0.35), transparent 55%),
    radial-gradient(1000px 800px at 110% 0%, rgba(255,92,0,0.20), transparent 55%),
    #0b0f1a;
`;

export const Topbar = styled.header`
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  color: #fff;
  position: sticky;
  top: 0;
  backdrop-filter: blur(12px);
  background: rgba(11, 15, 26, 0.6);
  border-bottom: 1px solid rgba(255,255,255,0.08);
`;

export const Brand = styled.div`
  font-weight: 900;
  letter-spacing: 0.3px;
`;

export const Nav = styled.nav`
  display: flex;
  gap: 10px;
`;

export const NavItem = styled.a`
  display: flex;
  align-items: center;

  width: 100%;
  min-width: 0;                 /* ✅ importantíssimo em layout flex */
  padding: 10px 12px;
  border-radius: 12px;

  color: rgba(255,255,255,0.85);
  text-decoration: none;

  white-space: nowrap;          /* ✅ não quebrar linha */
  overflow: hidden;             /* ✅ evita vazar */
  text-overflow: ellipsis;      /* ✅ coloca ... quando precisar */

  &.active{
    color: #fff;
    background: rgba(0,94,255,0.22);
    border: 1px solid rgba(0,94,255,0.35);
  }
`;



export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const Chip = styled.div`
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.10);
`;

export const Btn = styled.button`
  border: none;
  cursor: pointer;
  color: #fff;
  font-weight: 700;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.12);
`;

export const Content = styled.main`
  padding: 18px;
`;

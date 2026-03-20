import styled from "styled-components";

export const Layout = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  zoom: 110%;
`;

export const Topbar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 2px solid #ED1C24;
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 70px;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
    min-height: auto;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

export const BrandMark = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 16px;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;
  
  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
`;

export const BrandText = styled.div`
  min-width: 0;
`;

export const BrandTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
`;

export const BrandSubtitle = styled.div`
  margin-top: 2px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    white-space: normal;
  }
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const NavItem = styled.a`
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 10px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: #6b7280;
  font-weight: 600;
  transition: all 0.18s ease;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: #f9fafb;
    color: #111827;
  }

  &.active {
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
  }
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

export const Chip = styled.div`
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
`;

export const Btn = styled.button`
  border: 1px solid #e5e7eb;
  cursor: pointer;
  color: #374151;
  font-weight: 700;
  padding: 10px 14px;
  border-radius: 14px;
  background: #ffffff;
  transition: all 0.18s ease;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

export const Content = styled.main`
  padding: 24px 28px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;
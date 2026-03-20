import styled from "styled-components";

export const Layout = styled.div`
  min-height: 100vh;
  background: #f6f7f9;
`;

export const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  min-height: 82px;
  padding: 14px 28px;

  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 0 rgba(17, 24, 39, 0.02);

  @media (max-width: 768px) {
    flex-wrap: wrap;
    align-items: flex-start;
    padding: 14px 16px;
    min-height: auto;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
`;

export const BrandMark = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 14px;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;

  img {
    display: block;
    width: 96px;
    height: auto;
    max-width: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    padding-right: 12px;

    img {
      width: 82px;
    }
  }
`;

export const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

export const BrandTitle = styled.div`
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
  line-height: 1.05;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export const BrandSubtitle = styled.div`
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.25;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
    padding-top: 4px;
  }
`;

export const UserBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background: linear-gradient(135deg, #ed1c24 0%, #c5161d 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 18px rgba(237, 28, 36, 0.18);
`;

export const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;

  font-size: 13px;
  font-weight: 600;
  color: #374151;

  background: #f9fafb;
  border: 1px solid #e5e7eb;

  white-space: nowrap;

  strong {
    color: #111827;
    font-weight: 700;
  }

  span {
    color: #9ca3af;
  }

  @media (max-width: 768px) {
    min-width: 0;
    max-width: calc(100vw - 120px);
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const Btn = styled.button`
  border: 1px solid #e5e7eb;
  cursor: pointer;

  min-height: 42px;
  padding: 0 16px;
  border-radius: 14px;

  color: #374151;
  background: #ffffff;
  font-size: 13px;
  font-weight: 700;

  transition: all 0.18s ease;

  &:hover {
    background: #fff5f5;
    border-color: #f1b5b8;
    color: #b91c1c;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const Content = styled.main`
  padding: 24px 28px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;
import styled from "styled-components";

export const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const Aside = styled.aside`
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 40px;
  overflow: hidden;

  background:
    radial-gradient(circle at top left, rgba(237, 28, 36, 0.10), transparent 35%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.10), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);

  @media (max-width: 900px) {
    display: none;
  }
`;

export const AsideInner = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 36px;
`;

export const BrandMark = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 16px;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;

  img {
    display: block;
    width: 130px;
    height: auto;
    object-fit: contain;
  }
`;

export const BrandText = styled.div`
  min-width: 0;
`;

export const BrandTitle = styled.h1`
  margin: 0;
  font-size: 25px;
  line-height: 1.05;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #111827;
`;

export const BrandSubtitle = styled.p`
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.45;
  color: #6b7280;
`;

export const HeroCard = styled.div`
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(229, 231, 235, 0.95);
  box-shadow:
    0 10px 30px rgba(17, 24, 39, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
`;

export const HeroEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(237, 28, 36, 0.08);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

export const HeroTitle = styled.h2`
  margin: 0px 0 25px;
  font-size: 34px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #111827;
`;

export const HeroText = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #4b5563;
`;

export const Bullets = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 25px;
`;

export const Bullet = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ed1c24 0%, #f59e0b 100%);
    flex-shrink: 0;
  }
`;

export const Main = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
`;

export const LoginCard = styled.div`
  width: 100%;
  max-width: 430px;
  padding: 30px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 45px rgba(17, 24, 39, 0.08);

  @media (max-width: 480px) {
    padding: 22px;
    border-radius: 22px;
  }
`;

export const MobileBrand = styled.div`
  display: none;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    display: block;
  }
`;

export const MobileBrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

export const MobileBrandMark = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 12px;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;

  img {
    display: block;
    width: 88px;
    height: auto;
    object-fit: contain;
  }
`;

export const MobileBrandText = styled.div`
  min-width: 0;
`;

export const MobileBrandTitle = styled.div`
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
  line-height: 1.1;
`;

export const MobileBrandSubtitle = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.35;
`;

export const CardHeader = styled.div`
  margin-bottom: 24px;
`;

export const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
`;

export const Title = styled.h2`
  margin: 16px 0 8px;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.08;
  color: #111827;
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
`;

export const Form = styled.form`
  display: grid;
  gap: 16px;
`;

export const Field = styled.div`
  display: grid;
  gap: 8px;
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: #374151;
`;

export const Input = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  outline: none;
  transition: all 0.18s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #ed1c24;
    box-shadow: 0 0 0 4px rgba(237, 28, 36, 0.10);
  }
`;

export const ErrorText = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;
`;

export const SubmitButton = styled.button`
  min-height: 50px;
  border: none;
  border-radius: 16px;
  cursor: pointer;

  background: linear-gradient(135deg, #ed1c24 0%, #c5161d 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.01em;

  transition: all 0.18s ease;
  box-shadow: 0 10px 24px rgba(237, 28, 36, 0.24);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(237, 28, 36, 0.28);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow: none;
  }
`;

export const FooterText = styled.p`
  margin: 18px 0 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: #9ca3af;
`;
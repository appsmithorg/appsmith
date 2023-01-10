import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Text } from "design-system";

export const BillingPageWrapper = styled.div`
  padding: 40px 20px;
  width: 100%;
  height: 100vh;
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .header-text {
    font-size: 24px;
  }
`;

export const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  margin-top: 60px;
`;

export const StyledCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 104px;
  border-radius: 8px;
  padding: 20px;
  gap: 20px;
  box-shadow: 0 1px 6px rgb(0 0 0 / 0.2);
`;

export const CardLeftContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
`;

export const CardTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(94, 93, 193, 0.15);
`;

export const CardRightContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HeaderText = styled(Text)`
  font-size: 24px;
`;

export const UserCount = styled(Text)`
  font-size: 24px;
  margin-right: 10px;
`;

export const CTATextWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  .cta-text {
    color: ${Colors.CTA_PURPLE};
  }
`;

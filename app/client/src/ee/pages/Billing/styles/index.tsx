import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Button, DialogComponent, Text, TextInput } from "design-system-old";
import { IntentColors } from "constants/DefaultTheme";

export const BillingPageWrapper = styled.div`
  padding: 48px 48px;
  width: 100%;
  overflow: auto;
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
  margin-top: 24px;
`;

export const StyledCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${Colors.GRAY_200};
  width: 70%;
  min-width: 500px;
  padding: 30px;
  gap: 20px;
  .portal-btn {
    border: none;
    border-bottom: 1px solid ${Colors.SCORPION};
    border-radius: 5px 5px 0 0;
    padding: 10px 0;
    font-size: 13px;
    font-weight: 600;
    gap: 4px;
    svg path {
      fill: ${Colors.SCORPION};
    }
    :hover {
      cursor: pointer;
      background-color: transparent;
    }
  }
  .update-license-btn {
    border: 1.2px solid ${Colors.SCORPION};
    padding: 1px 14px;
  }
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
  gap: 8px;
`;

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${Colors.GRAY_100};
  pointer-events: none;
`;

export const CardRightContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const UserCount = styled(Text)`
  font-size: 24px;
  margin-right: 10px;
`;

export const CTATextWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  .cta-text {
    color: ${Colors.CTA_PURPLE};
    font-size: 14px;
  }
  .cta-icon {
    top: 2px;
    position: relative;
  }
`;

export const FlexWrapper = styled.div<{
  dir: "row" | "column";
  align?: string;
  justify?: string;
}>`
  display: flex;
  align-items: ${(props) => props.align ?? "initial"};
  justify-content: ${(props) => props.justify ?? "initial"};
  flex-direction: ${(props) => props.dir};
  gap: 8px;
`;

export const StyledButton = styled(Button)`
  width: 100%;
`;

export const StyledDialog = styled(DialogComponent)`
  padding: 24px 36px;
`;

export const DialogWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  width: 100%;
  margin-top: 32px;
`;

export const DialogHeaderImg = styled.img`
  position: fixed;
  transform: translateY(-96%);
  z-index: 1;
  width: 190px;
`;

export const StyledInput = styled(TextInput)`
  width: 100%;
`;

export const StyledForm = styled.form<{ showError?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  .ur--has-border {
    width: 100%;
    border: ${(props) =>
      props.showError && `1.2px solid ${IntentColors.danger}`};
  }
  .license-input-label {
    margin-bottom: 8px;
  }
  .input-error-msg {
    margin-top: 4px;
    color: ${IntentColors.danger};
  }
`;

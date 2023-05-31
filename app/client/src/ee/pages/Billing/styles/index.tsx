import styled from "styled-components";
import { Text, Input } from "design-system";

export const BillingPageWrapper = styled.div`
  padding: 30px 0 0 24px;
  width: 100%;
  overflow: auto;
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .header-text {
    font-size: 24px;
    color: var(--ads-v2-color-fg-emphasis-plus);
  }
`;

export const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 24px;

  > div:not(:last-child) {
    border-bottom: 1px solid var(--ads-v2-color-border);
  }
`;

export const StyledCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 60%;
  min-width: 500px;
  padding: 24px 16px;
  gap: 20px;
`;

export const CardLeftContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;

  .license-key-text {
    color: var(--ads-v2-color-fg-muted);
  }
`;

export const CardTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--ads-v2-color-fg);
`;

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  margin-right: 10px;
`;

export const CardRightContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StyledImage = styled.img`
  margin: auto;
  width: 190px;
`;

export const UserCount = styled(Text)`
  margin-right: 10px;
`;

export const CTATextWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  .cta-text {
    color: var(--ads-v2-color-fg);
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

export const StyledInput = styled(Input)`
  width: 100%;
`;

export const StyledForm = styled.form<{ showError?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  .ur--has-border {
    width: 100%;
    border: ${(props) =>
      props.showError && `1.2px solid var(--ads-v2-color-border-error)`};
  }
  .license-input-label {
    margin-bottom: 8px;
  }
  .input-error-msg {
    margin-top: 4px;
    color: var(--ads-v2-color-fg-error);
  }
`;

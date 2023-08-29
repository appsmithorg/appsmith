import styled from "styled-components";
import { Input, Link, Text } from "design-system";

export const StyledPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  justify-content: start;
  gap: 40px;
  margin: 100px 0;
`;

export const StyledCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const StyledCard = styled.div<{ noField?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 500px;
  height: 260px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  padding: 20px;
  gap: 24px;
`;

export const StyledForm = styled.form<{ showError?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: var(--ads-v2-border-radius);
  .ur--has-border {
    width: 100%;
    border: ${(props) =>
      props.showError && `1.2px solid var(--ads-v2-color-fg-error)`};
  }
  .license-input-label {
    margin-bottom: 8px;
  }
  .input-error-msg {
    margin-top: 4px;
  }
`;

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--ads-v2-color-bg-muted);
  pointer-events: none;

  svg {
    fill: var(--ads-v2-color-fg-emphasis-plus);
  }
`;

export const StyledContent = styled(Text)`
  width: 50%;
  text-align: center;
  .license-input {
    width: 100%;
  }
`;

export const StyledBannerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 20px;
`;

export const StyledInput = styled(Input)``;

export const StyledLink = styled(Link)`
  width: 50%;
`;

export const StyledLinkWrapper = styled.div`
  width: 100%;
  display: flex;
`;

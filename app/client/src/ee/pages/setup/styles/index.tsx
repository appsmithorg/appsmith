import styled from "styled-components";
import { Button, TextInput } from "design-system-old";
import { IntentColors } from "constants/DefaultTheme";

export const StyledPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  align-items: center;
  justify-content: start;
  gap: 40px;
  margin: 100px 0;
`;

export const StyledCardWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 50px;
  flex-wrap: wrap;
`;

export const StyledCard = styled.div<{ noField?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 500px;
  height: 260px;
  border: 1px solid var(--appsmith-color-black-400);
  border-radius: 8px;
  padding: 20px;
  gap: 24px;
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

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--appsmith-color-black-100);

  svg {
    fill: var(--appsmith-color-black-700);
  }
`;

export const StyledContent = styled.div`
  width: 100%;
  height: 60px;
  text-align: center;
  .license-input {
    width: 100%;
  }
`;

export const StyledButton = styled(Button)`
  width: 100%;
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

export const StyledInput = styled(TextInput)`
  width: 100%;
`;

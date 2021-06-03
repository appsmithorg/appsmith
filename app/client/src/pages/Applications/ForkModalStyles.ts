import styled from "styled-components";
import Button from "components/ads/Button";
import RadioComponent from "components/ads/Radio";
import { getTypographyByKey } from "constants/DefaultTheme";
import Dialog from "components/ads/DialogComponent";
import { Classes } from "@blueprintjs/core";

const TriggerButton = styled(Button)`
  ${(props) => getTypographyByKey(props, "btnLarge")}
  height: 100%;
  svg {
    transform: rotate(-90deg);
  }
`;

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 0px;
  }
`;

const StyledRadioComponent = styled(RadioComponent)`
  label {
    font-size: 16px;
    margin-bottom: 32px;
  }
`;

const ForkButton = styled(Button)<{ disabled?: boolean }>`
  height: 38px;
  width: 203px;
  pointer-events: ${(props) => (!!props.disabled ? "none" : "auto")};
`;

const OrganizationList = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export {
  TriggerButton,
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
  SpinnerWrapper,
};

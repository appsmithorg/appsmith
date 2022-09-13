import styled from "styled-components";
import { Button, RadioComponent } from "design-system";
import { getTypographyByKey } from "constants/DefaultTheme";
import Dialog from "components/ads/DialogComponent";
import { Classes } from "@blueprintjs/core";

const TriggerButton = styled(Button)`
  ${(props) => getTypographyByKey(props, "btnLarge")}
  height: 100%;
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

const WorkspaceList = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.spaces[11]}px;
  gap: ${(props) => props.theme.spaces[4]}px;
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
  WorkspaceList,
  ButtonWrapper,
  SpinnerWrapper,
};

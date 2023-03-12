import styled from "styled-components";
import { DialogComponent as Dialog } from "design-system-old";
import { Classes } from "@blueprintjs/core";

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 0px;
  }
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

export { StyledDialog, ButtonWrapper, SpinnerWrapper };

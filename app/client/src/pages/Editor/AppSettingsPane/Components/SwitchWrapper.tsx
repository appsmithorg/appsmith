import { Colors } from "constants/Colors";
import styled from "styled-components";

const SwitchWrapper = styled.div`
  &&&&&&&
    .bp3-control.bp3-switch
    input:checked:disabled
    ~ .bp3-control-indicator {
    background: ${Colors.GREY_200};
  }

  .bp3-control.bp3-switch
    input:checked:disabled
    ~ .bp3-control-indicator::before {
    box-shadow: none;
  }
`;

export default SwitchWrapper;

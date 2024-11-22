import { Button } from "@appsmith/ads";
import styled from "styled-components";

export const DebuggerTriggerButton = styled(Button)`
  /* Override the min-width of the button for debugger trigger only */

  .ads-v2-button__content {
    min-width: unset;
  }
`;

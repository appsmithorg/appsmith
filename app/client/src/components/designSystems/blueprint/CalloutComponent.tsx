import styled from "styled-components";
import { Callout } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const CalloutComponent = styled(Callout)<{ background?: string }>`
  && {
    background-color: ${props => props.background || Colors.WHITE_SMOKE};
  }
`;

export default CalloutComponent;

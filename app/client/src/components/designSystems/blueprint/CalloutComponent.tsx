import styled from "styled-components";
import { Callout } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const CalloutComponent = styled(Callout)`
  && {
    background-color: ${Colors.WHITE_SMOKE};
  }
`;

export default CalloutComponent;

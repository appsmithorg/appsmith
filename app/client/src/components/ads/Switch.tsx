import styled from "constants/DefaultTheme";
import { Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

export default styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }
`;

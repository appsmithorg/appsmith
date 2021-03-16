import styled from "constants/DefaultTheme";
import { Switch } from "@blueprintjs/core";

export default styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${(props) => props.theme.colors.selected};
  }
`;

import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import { Intent, BlueprintButtonIntentsCSS } from "constants/DefaultTheme";

type FormActionButtonProps = {
  intent?: Intent;
  large?: boolean;
};

export default styled(Button)<FormActionButtonProps>`
  ${BlueprintButtonIntentsCSS}
`;

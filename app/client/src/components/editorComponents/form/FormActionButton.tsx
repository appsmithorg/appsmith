import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import type { Intent } from "constants/DefaultTheme";
import { BlueprintButtonIntentsCSS } from "constants/DefaultTheme";

interface FormActionButtonProps {
  intent?: Intent;
  large?: boolean;
}

export default styled(Button)<FormActionButtonProps>`
  ${BlueprintButtonIntentsCSS}
`;

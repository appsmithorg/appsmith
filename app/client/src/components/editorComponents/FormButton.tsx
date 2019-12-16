import { Button } from "@blueprintjs/core";
import styled from "styled-components";
import { Intent, IntentColors } from "constants/DefaultTheme";
import tinycolor from "tinycolor2";

type FormButtonProps = {
  intent: Intent;
};

export default styled(Button)<FormButtonProps>`
  &&& {
    font-weight: ${props => props.theme.fontWeights[2]};
    border: none;
    flex-grow: 1;
    outline: none;
    box-shadow: none;
    background: ${props => IntentColors[props.intent]};
    &:hover {
      background: ${props =>
        new tinycolor(IntentColors[props.intent]).darken(10).toString()};
    }
    &:active {
      outline: none;
      background: ${props =>
        new tinycolor(IntentColors[props.intent]).darken(20).toString()};
    }
  }
`;

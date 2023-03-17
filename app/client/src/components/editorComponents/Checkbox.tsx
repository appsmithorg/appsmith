import React from "react";
import styled from "styled-components";
import {
  Checkbox as BlueprintCheckbox,
  ICheckboxProps,
} from "@blueprintjs/core";
import {
  IntentColors,
  Intent,
  getBorderCSSShorthand,
} from "constants/DefaultTheme";

export type CheckboxProps = ICheckboxProps & {
  intent: Intent;
  align: "left" | "right";
  input?: {
    onChange?: (value: boolean) => void;
    value?: boolean;
    checked?: boolean;
  };
  label: string;
};

export const StyledCheckbox = styled(BlueprintCheckbox)<CheckboxProps>`
  &&&& {
    span.bp3-control-indicator {
      outline: none;
      box-shadow: none;
      border-radius: ${(props) => props.theme.radii[1]}px;
      border: ${(props) => getBorderCSSShorthand(props.theme.borders[3])};
      height: ${(props) => props.theme.fontSizes[5]}px;
      width: ${(props) => props.theme.fontSizes[5]}px;
    }
    input:checked ~ span.bp3-control-indicator {
      background: ${(props) => IntentColors[props.intent]};
      box-shadow: none;
      outline: none;
    }
  }
`;

export function Checkbox(props: CheckboxProps) {
  const handleChange = (e: any) => {
    props.input &&
      props.input.onChange &&
      props.input.onChange(e.target.checked);
  };
  return (
    <StyledCheckbox
      {...props}
      alignIndicator={props.align}
      checked={props.input ? !!props.input.checked : false}
      label={props.label}
      onChange={handleChange}
    />
  );
}

export default Checkbox;

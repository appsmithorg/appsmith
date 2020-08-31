import { CommonComponentProps } from "./common";
import React, { useState, useEffect } from "react";
import { Checkbox } from "@blueprintjs/core/lib/esm/components";
import styled from "styled-components";

type CheckboxProps = CommonComponentProps & {
  label: string;
  isChecked: boolean;
  onCheckChange: (isChecked: boolean) => void;
  align: "left" | "right";
};

const CheckboxContainer = styled.div<{ disabled?: boolean }>`
  &&&& .bp3-control {
    font-weight: ${props => props.theme.typography.p1.fontWeight};
    font-size: ${props => props.theme.typography.p1.fontSize}px;
    line-height: ${props => props.theme.typography.p1.lineHeight}px;
    letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
    color: ${props => props.theme.colors.blackShades[7]};
  }

  &&&& .bp3-control input:checked ~ .bp3-control-indicator {
    background-color: ${props =>
      props.disabled
        ? props.theme.colors.blackShades[3]
        : props.theme.colors.info.main};
    background-image: none;
    box-shadow: none;
    border: 2px solid
      ${props =>
        props.disabled
          ? props.theme.colors.blackShades[3]
          : props.theme.colors.info.main};
  }

  &&&& .bp3-control.bp3-checkbox .bp3-control-indicator {
    border-radius: 0px;
  }

  &&&& .bp3-control-indicator {
    width: ${props => props.theme.spaces[8]}px;
    height: ${props => props.theme.spaces[8]}px;
    margin-top: 0px;
    box-shadow: none;
    border: 2px solid ${props => props.theme.colors.blackShades[4]};
    background: transparent;
  }

  &&&&
    .bp3-control.bp3-checkbox
    input:checked
    ~ .bp3-control-indicator::before {
    background-image: none;
    position: absolute;
    top: 0px;
    left: ${props => props.theme.spaces[1]}px;
    width: ${props => props.theme.spaces[2]}px;
    height: ${props => props.theme.spaces[5] - 1}px;
    border: solid ${props => (props.disabled ? "#565656" : "#FFFFFF")};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const CheckboxComponent = (props: CheckboxProps) => {
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    setChecked(props.isChecked);
  }, [props.isChecked]);

  return (
    <CheckboxContainer disabled={props.disabled}>
      <Checkbox
        checked={checked}
        disabled={props.disabled}
        alignIndicator={props.align}
        label={props.label}
        onChange={(e: any) => {
          setChecked(e.target.checked);
          props.onCheckChange(e.target.checked);
        }}
      />
    </CheckboxContainer>
  );
};

export default CheckboxComponent;

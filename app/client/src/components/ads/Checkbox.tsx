import { CommonComponentProps } from "./common";
import React, { useState, useEffect } from "react";
import styled from "styled-components";

type CheckboxAlign = "left" | "right";

type CheckboxProps = CommonComponentProps & {
  label: string;
  isChecked?: boolean;
  onCheckChange?: (isChecked: boolean) => void;
  align?: CheckboxAlign;
};

const StyledCheckbox = styled.label<{
  disabled?: boolean;
  align?: CheckboxAlign;
  isChecked?: boolean;
}>`
  position: relative;
  display: block;
  width: 100%;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: ${props => props.theme.typography.p1.fontWeight};
  font-size: ${props => props.theme.typography.p1.fontSize}px;
  line-height: ${props => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
  color: ${props => props.theme.colors.blackShades[7]};
  padding-left: ${props =>
    props.align === "left" ? props.theme.spaces[12] - 2 : 0}px;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .checkmark {
    position: absolute;
    top: 1px;
    ${props => (props.align === "left" ? `left: 0` : `right: 0`)};
    width: ${props => props.theme.spaces[8]}px;
    height: ${props => props.theme.spaces[8]}px;
    background-color: ${props =>
      props.isChecked
        ? props.disabled
          ? props.theme.colors.blackShades[3]
          : props.theme.colors.info.main
        : "transparent"};
    border: 2px solid
      ${props =>
        props.isChecked
          ? props.disabled
            ? props.theme.colors.blackShades[3]
            : props.theme.colors.info.main
          : props.theme.colors.blackShades[4]};
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  input:checked ~ .checkmark:after {
    display: block;
  }

  .checkmark::after {
    top: 0px;
    left: 4px;
    width: 6px;
    height: 11px;
    border: solid
      ${props =>
        props.disabled ? "#565656" : props.theme.colors.blackShades[9]};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const Checkbox = (props: CheckboxProps) => {
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    if (props.isChecked) {
      setChecked(props.isChecked);
    }
  }, [props.isChecked]);

  const onChangeHandler = (checked: boolean) => {
    setChecked(checked);
    props.onCheckChange && props.onCheckChange(checked);
  };

  return (
    <StyledCheckbox
      disabled={props.disabled}
      align={props.align}
      isChecked={checked}
    >
      {props.label}
      <input
        type="checkbox"
        checked={checked}
        disabled={props.disabled}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChangeHandler(e.target.checked)
        }
      />
      <span className="checkmark"></span>
    </StyledCheckbox>
  );
};

Checkbox.defaultProps = {
  isChecked: false,
  align: "left",
};

export default Checkbox;

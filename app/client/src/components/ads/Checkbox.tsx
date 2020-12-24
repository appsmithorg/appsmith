import { CommonComponentProps } from "./common";
import React, { useState } from "react";
import styled from "styled-components";

type CheckboxProps = CommonComponentProps & {
  label: string;
  onCheckChange?: (isChecked: boolean) => void;
};

const Checkmark = styled.span<{
  disabled?: boolean;
  isChecked?: boolean;
}>`
  position: absolute;
  top: 1px;
  left: 0;
  width: ${(props) => props.theme.spaces[8]}px;
  height: ${(props) => props.theme.spaces[8]}px;
  background-color: ${(props) =>
    props.isChecked
      ? props.disabled
        ? props.theme.colors.checkbox.disabled
        : props.theme.colors.info.main
      : "transparent"};
  border: 2px solid
    ${(props) =>
      props.isChecked
        ? props.disabled
          ? props.theme.colors.checkbox.disabled
          : props.theme.colors.info.main
        : props.theme.colors.checkbox.unchecked};

  &::after {
    content: "";
    position: absolute;
    display: none;
    top: 0px;
    left: 4px;
    width: 6px;
    height: 11px;
    border: solid
      ${(props) =>
        props.disabled
          ? props.theme.colors.checkbox.disabledCheck
          : props.theme.colors.checkbox.normalCheck};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const StyledCheckbox = styled.label<{
  disabled?: boolean;
}>`
  position: relative;
  display: block;
  width: 100%;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: ${(props) => props.theme.typography.p1.fontWeight};
  font-size: ${(props) => props.theme.typography.p1.fontSize}px;
  line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.p1.letterSpacing}px;
  color: ${(props) => props.theme.colors.checkbox.labelColor};
  padding-left: ${(props) => props.theme.spaces[12] - 2}px;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  input:checked ~ ${Checkmark}:after {
    display: block;
  }
`;

const Checkbox = (props: CheckboxProps) => {
  const [checked, setChecked] = useState<boolean>(false);

  const onChangeHandler = (checked: boolean) => {
    setChecked(checked);
    props.onCheckChange && props.onCheckChange(checked);
  };

  return (
    <StyledCheckbox data-cy={props.cypressSelector} disabled={props.disabled}>
      {props.label}
      <input
        type="checkbox"
        disabled={props.disabled}
        checked={checked}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChangeHandler(e.target.checked)
        }
      />
      <Checkmark disabled={props.disabled} isChecked={checked} />
    </StyledCheckbox>
  );
};

export default Checkbox;

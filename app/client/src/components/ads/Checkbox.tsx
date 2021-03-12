import { Classes, CommonComponentProps } from "./common";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import { Colors } from "constants/Colors";

export type CheckboxProps = CommonComponentProps & {
  label: string;
  isDefaultChecked?: boolean;
  onCheckChange?: (isChecked: boolean) => void;
  info?: string;
};

const Checkmark = styled.span<{
  disabled?: boolean;
  isChecked?: boolean;
  info?: string;
}>`
  position: absolute;
  top: ${(props) => (props.info ? "6px" : "1px")};
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

const LabelContainer = styled.div<{ info?: string }>`
  display: flex;
  flex-direction: column;
  .${Classes.TEXT}:first-child {
    color: ${(props) => props.theme.colors.apiPane.settings.textColor};
  }
  ${(props) =>
    props.info
      ? `
    .${Classes.TEXT}:last-child {
    color: ${Colors.DOVE_GRAY};
    margin-top: 4px;
  }
  `
      : null}
`;

const useUpdate = (intitialValue?: boolean) => {
  const [checked, setChecked] = useState<boolean>(!!intitialValue);

  useEffect(() => {
    const isChecked = !!intitialValue;
    if (isChecked !== checked) {
      setChecked(isChecked);
    }
  }, [intitialValue]);

  return [checked, setChecked] as const;
};

const Checkbox = (props: CheckboxProps) => {
  const [checked, setChecked] = useUpdate(props.isDefaultChecked);

  const onChangeHandler = (checked: boolean) => {
    setChecked(checked);
    props.onCheckChange && props.onCheckChange(checked);
  };

  return (
    <StyledCheckbox data-cy={props.cypressSelector} disabled={props.disabled}>
      <LabelContainer info={props.info}>
        <Text type={TextType.P1}>{props.label}</Text>
        {props.info ? <Text type={TextType.P3}>{props.info}</Text> : null}
      </LabelContainer>
      <input
        type="checkbox"
        disabled={props.disabled}
        checked={checked}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChangeHandler(e.target.checked)
        }
      />
      <Checkmark
        disabled={props.disabled}
        isChecked={checked}
        info={props.info}
      />
    </StyledCheckbox>
  );
};

export default Checkbox;

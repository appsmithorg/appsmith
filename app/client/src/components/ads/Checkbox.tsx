import { Classes, CommonComponentProps } from "./common";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";

export enum CheckboxType {
  PRIMARY = "PRIMARY",
  "SECONDARY" = "SECONDARY",
}

export type CheckboxProps = CommonComponentProps & {
  label: string;
  isDefaultChecked?: boolean;
  onCheckChange?: (isChecked: boolean) => void;
  info?: string;
  backgroundColor?: string;
  fill?: boolean;
  name?: string;
  className?: string;
  type?: CheckboxType;
};

export const Checkmark = styled.span<{
  disabled?: boolean;
  isChecked?: boolean;
  info?: string;
  backgroundColor?: string;
  type?: CheckboxType;
}>`
  position: absolute;
  top: ${(props) => (props.info ? "6px" : "1px")};
  left: 0;
  width: ${(props) => props.theme.spaces[8]}px;
  height: ${(props) => props.theme.spaces[8]}px;
  ${(props) => {
    if (props.type === CheckboxType.PRIMARY) {
      return `
      background-color: ${
        props.isChecked
          ? props.disabled
            ? props.theme.colors.checkbox.disabled
            : props.backgroundColor || props.theme.colors.info.main
          : props.disabled
          ? props.theme.colors.checkbox.disabled
          : "transparent"
      };
      border: 1.8px solid
        ${
          props.isChecked
            ? props.disabled
              ? props.theme.colors.checkbox.disabled
              : props.backgroundColor || props.theme.colors.info.main
            : props.disabled
            ? props.theme.colors.checkbox.disabled
            : props.theme.colors.checkbox.unchecked
        };

        &::after {
          border: solid
            ${
              props.disabled
                ? props.theme.colors.checkbox.disabledCheck
                : props.theme.colors.checkbox.normalCheck
            };
        }
      `;
    } else {
      return `
      background-color: ${
        props.disabled ? props.theme.colors.checkbox.disabled : "transparent"
      };
      border: 1.8px solid
        ${
          props.isChecked
            ? props.disabled
              ? props.theme.colors.checkbox.disabled
              : props.backgroundColor || props.theme.colors.info.main
            : props.disabled
            ? props.theme.colors.checkbox.disabled
            : props.theme.colors.checkbox.unchecked
        };
        &::after {
          border: solid
            ${
              props.disabled
                ? props.backgroundColor || props.theme.colors.info.main
                : props.backgroundColor || props.theme.colors.info.main
            };
        }
      `;
    }
  }}

  &::after {
    content: "";
    position: absolute;
    display: none;
    top: 0px;
    left: 4px;
    width: 6px;
    height: 11px;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const StyledCheckbox = styled.label<{
  disabled?: boolean;
  $fill?: boolean;
}>`
  position: relative;
  display: block;
  width: ${(props) => (props.$fill ? "100%" : "unset")};
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

export const LabelContainer = styled.div<{ info?: string }>`
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

function Checkbox(props: CheckboxProps) {
  const { className, fill = true } = props;
  const [checked, setChecked] = useUpdate(props.isDefaultChecked);

  const onChangeHandler = (checked: boolean) => {
    setChecked(checked);
    props.onCheckChange && props.onCheckChange(checked);
  };

  return (
    <StyledCheckbox
      $fill={fill}
      className={className}
      data-cy={props.cypressSelector}
      disabled={props.disabled}
    >
      <LabelContainer info={props.info}>
        <Text type={TextType.P1}>{props.label}</Text>
        {props.info ? <Text type={TextType.P3}>{props.info}</Text> : null}
      </LabelContainer>
      <input
        checked={checked}
        disabled={props.disabled}
        name={props?.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChangeHandler(e.target.checked)
        }
        type="checkbox"
      />
      <Checkmark
        backgroundColor={props.backgroundColor}
        className={replayHighlightClass}
        disabled={props.disabled}
        info={props.info}
        isChecked={checked}
        type={props.type || CheckboxType.PRIMARY}
      />
    </StyledCheckbox>
  );
}

export default Checkbox;

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { CommonComponentProps } from "../types/common";
import { Classes, replayHighlightClass } from "../constants/classes";
import Text, { TextType } from "../Text";

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
  width: var(--ads-spaces-8);
  height: var(--ads-spaces-8);
  ${(props) => {
    if (props.type === CheckboxType.PRIMARY) {
      return `
      background-color: ${
        props.isChecked
          ? props.disabled
            ? "var(--ads-checkbox-disabled-checked-background-color)"
            : props.backgroundColor || "var(--ads-color-brand)"
          : props.disabled
            ? "var(--ads-checkbox-disabled-checked-background-color)"
            : "transparent"
      };
      border: 1.8px solid
        ${
          props.isChecked
            ? props.disabled
              ? "var(--ads-checkbox-disabled-checked-border-color)"
              : props.backgroundColor || "var(--ads-color-brand)"
            : props.disabled
              ? "var(--ads-checkbox-disabled-checked-border-color)"
              : "var(--ads-checkbox-default-unchecked-border-color)"
        };

        &::after {
          border: solid
            ${
              props.disabled
                ? "var(--ads-checkbox-after-disabled-checked-border-color)"
                : "var(--ads-checkbox-after-default-checked-border-color)"
            };
        }
      `;
    } else {
      return `
      background-color: ${
        props.disabled
          ? "var(--ads-checkbox-disabled-checked-background-color)"
          : "transparent"
      };
      border: 1.8px solid
        ${
          props.isChecked
            ? props.disabled
              ? "var(--ads-checkbox-disabled-checked-border-color)"
              : props.backgroundColor || "var(--ads-color-brand)"
            : props.disabled
              ? "var(--ads-checkbox-disabled-checked-border-color)"
              : "var(--ads-checkbox-default-unchecked-border-color)"
        };
        &::after {
          border: solid
            ${
              props.disabled
                ? props.backgroundColor || "var(--ads-color-brand)"
                : props.backgroundColor || "var(--ads-color-brand)"
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
  color: var(--ads-checkbox-label-text-color);
  padding-left: calc(var(--ads-spaces-12) - 2px);

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
    color: var(--ads-api-pane-settings-text-color);
  }
  ${(props) =>
    props.info
      ? `
    .${Classes.TEXT}:last-child {
    color: var(--ads-old-color-dove-gray);
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
  const { className, fill = true, onCheckChange } = props;
  const [checked, setChecked] = useUpdate(props.isDefaultChecked);

  const onChangeHandler = (checked: boolean) => {
    setChecked(checked);
    onCheckChange && onCheckChange(checked);
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
        type={props.type ?? CheckboxType.PRIMARY}
      />
    </StyledCheckbox>
  );
}

export default Checkbox;

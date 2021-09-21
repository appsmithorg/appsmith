import React from "react";
import styled from "styled-components";
import { Alignment, Switch } from "@blueprintjs/core";

import { generateReactKey } from "utils/generators";
import { ThemeProp } from "components/ads/common";
import { BlueprintControlTransform } from "constants/DefaultTheme";

export interface OptionProps {
  label?: string;
  value: string;
}

export interface SwitchGroupContainerProps {
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
}

export const SwitchGroupContainer = styled.div<
  ThemeProp & SwitchGroupContainerProps
>`
  display: ${({ inline }) => (inline ? "inline-flex" : "flex")};
  ${({ inline }) => `
    flex-direction: ${inline ? "row" : "column"};
    align-items: ${inline ? "center" : "flex-start"};
    ${inline && "flex-wrap: wrap"};
  `}
  justify-content: ${({ inline, optionCount }) =>
    optionCount > 1 ? `space-between` : inline ? `flex-start` : `center`};
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 1px solid transparent;
  ${({ theme, valid }) =>
    !valid &&
    `
    border: 1px solid ${theme.colors.error};
  `}
  padding: 2px 4px;

  ${BlueprintControlTransform}
`;

export interface StyledSwitchProps {
  disabled?: boolean;
  inline?: boolean;
  optionCount: number;
  rowSpace: number;
}

const StyledSwitch = styled(Switch)<ThemeProp & StyledSwitchProps>`
  height: ${({ rowSpace }) => rowSpace}px;

  &.bp3-control.bp3-switch {
    margin-top: ${({ inline, optionCount }) =>
      (inline || optionCount === 1) && `4px`};
  }
`;

function SwitchGroupComponent(props: SwitchGroupComponentProps) {
  const {
    disabled,
    inline,
    onChange,
    options,
    rowSpace,
    selectedValues,
    valid,
  } = props;

  return (
    <SwitchGroupContainer
      inline={inline}
      optionCount={options.length}
      valid={valid}
    >
      {options &&
        options.length > 0 &&
        [...options].map((option: OptionProps) => (
          <StyledSwitch
            checked={(selectedValues || []).includes(option.value)}
            disabled={disabled}
            inline={inline}
            key={generateReactKey()}
            label={option.label}
            onChange={onChange(option.value)}
            optionCount={options.length}
            rowSpace={rowSpace}
          />
        ))}
    </SwitchGroupContainer>
  );
}

export interface Item {
  widgetId: string;
  id: string;
  index: number;
  isVisible?: boolean;
  isDisabled?: boolean;
  label?: string;
  value: string;
  alignIndicator?: Alignment;
  defaultChecked?: boolean;
  checked?: boolean;
}

export interface SwitchGroupComponentProps {
  disabled?: boolean;
  inline?: boolean;
  options: OptionProps[];
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
  required?: boolean;
  rowSpace: number;
  selectedValues: string[];
  valid?: boolean;
}

export default SwitchGroupComponent;

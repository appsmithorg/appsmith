import React from "react";
import styled from "styled-components";
import { Alignment, Switch } from "@blueprintjs/core";

import { ThemeProp } from "components/ads/common";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import { StyledSwitch } from "widgets/SwitchWidget/component";

export interface OptionProps {
  label?: string;
  value: string;
}

export interface SwitchGroupContainerProps {
  alignment: Alignment;
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
}

export const SwitchGroupContainer = styled.div<
  ThemeProp & SwitchGroupContainerProps
>`
  display: ${({ inline }) => (inline ? "inline-flex" : "flex")};
  ${({ alignment, inline }) => `
    flex-direction: ${inline ? "row" : "column"};
    align-items: ${
      inline
        ? "center"
        : alignment === Alignment.LEFT
        ? "flex-start"
        : "flex-end"
    };
    ${inline && "flex-wrap: wrap"};
  `}
  justify-content: ${({ alignment, inline, optionCount }) =>
    optionCount > 1
      ? `space-between`
      : inline
      ? alignment === Alignment.LEFT
        ? `flex-start`
        : `flex-end`
      : `center`};
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
  backgroundColor: string;
}

function SwitchGroupComponent(props: SwitchGroupComponentProps) {
  const {
    alignment,
    backgroundColor,
    disabled,
    inline,
    onChange,
    options,
    rowSpace,
    selected,
    valid,
  } = props;

  return (
    <SwitchGroupContainer
      alignment={alignment}
      inline={inline}
      optionCount={(options || []).length}
      valid={valid}
    >
      {Array.isArray(options) &&
        options.length > 0 &&
        options.map((option: OptionProps) => (
          <StyledSwitch
            alignIndicator={alignment}
            backgroundColor={backgroundColor}
            checked={selected.includes(option.value)}
            disabled={disabled}
            inline={inline}
            key={option.value}
            label={option.label}
            onChange={onChange(option.value)}
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
  alignment: Alignment;
  disabled?: boolean;
  inline?: boolean;
  options: OptionProps[];
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
  required?: boolean;
  rowSpace: number;
  selected: string[];
  valid?: boolean;
  backgroundColor: string;
}

export default SwitchGroupComponent;

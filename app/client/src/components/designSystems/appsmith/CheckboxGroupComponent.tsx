import * as React from "react";
import styled from "styled-components";
import { Checkbox } from "@blueprintjs/core";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { ThemeProp } from "components/ads/common";
import { generateReactKey } from "utils/generators";

export interface CheckboxGroupContainerProps {
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
}

const CheckboxGroupContainer = styled.div<
  ThemeProp & CheckboxGroupContainerProps
>`
  display: flex;
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
`;

export interface StyledCheckboxProps {
  disabled?: boolean;
  optionCount: number;
  rowspace: number;
}

const StyledCheckbox = styled(Checkbox)<ThemeProp & StyledCheckboxProps>`
  height: ${({ rowspace }) => rowspace}px;

  &.bp3-control.bp3-checkbox {
    color: ${({ theme }) => theme.colors.comments.resolved};
    margin-bottom: ${({ inline, optionCount }) =>
      (inline || optionCount === 1) && `6px`};
  }

  &.bp3-control input:checked ~ .bp3-control-indicator {
    box-shadow: none;
    border: none;
    background-image: none;
    background-color: ${({ theme }) =>
      theme.colors.button.primary.solid.bgColor};
  }

  &.bp3-control input:not(:disabled):active ~ .bp3-control-indicator {
    background: none;
    box-shadow: none;
  }

  &.bp3-control.bp3-checkbox .bp3-control-indicator {
    border: ${({ theme }) =>
      `1.5px solid ${theme.colors.button.disabled.bgColor}`};
    border-radius: 0;
  }
`;

export interface OptionProps {
  /** Label text for this option. If omitted, `value` is used as the label. */
  label?: string;

  /** Value of this option. */
  value: string;
}

export interface CheckboxGroupComponentProps extends ComponentProps {
  isDisabled?: boolean;
  isInline?: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
  options: OptionProps[];
  rowSpace: number;
  selectedValues: string[];
}

function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  const {
    isDisabled,
    isInline,
    isValid,
    onChange,
    options,
    rowSpace,
    selectedValues,
  } = props;

  return (
    <CheckboxGroupContainer
      inline={isInline}
      optionCount={options.length}
      valid={isValid}
    >
      {options &&
        options.length > 0 &&
        [...options].map((option: OptionProps) => (
          <StyledCheckbox
            checked={(selectedValues || []).includes(option.value)}
            disabled={isDisabled}
            inline={isInline}
            key={generateReactKey()}
            label={option.label}
            onChange={onChange(option.value)}
            optionCount={options.length}
            rowspace={rowSpace}
          />
        ))}
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;

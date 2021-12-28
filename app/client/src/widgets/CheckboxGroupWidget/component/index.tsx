import React from "react";
import styled from "styled-components";
import { Checkbox } from "@blueprintjs/core";

import { Classes } from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { ThemeProp } from "components/ads/common";
import { generateReactKey } from "utils/generators";
import { Colors } from "constants/Colors";

// TODO(abstraction-issue): this needs to be a common import from somewhere in the platform
// Alternatively, they need to be replicated.

export interface CheckboxGroupContainerProps {
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
}

const CheckboxGroupContainer = styled.div<
  ThemeProp & CheckboxGroupContainerProps
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
  .${Classes.CONTROL} {
    display: flex;
    align-items: center;
    margin-bottom: 0;
    min-height: 36px;
    margin: 0px 12px;
  }
`;

export interface StyledCheckboxProps {
  disabled?: boolean;
  optionCount: number;
  rowspace: number;
  backgroundColor: string;
  borderRadius: string;
}

const StyledCheckbox = styled(Checkbox)<ThemeProp & StyledCheckboxProps>`
  height: ${({ rowspace }) => rowspace}px;

  &.bp3-control.bp3-checkbox {
    color: ${({ theme }) => theme.colors.comments.resolved};
    margin-top: ${({ inline, optionCount }) =>
      (inline || optionCount === 1) && `4px`};

    .bp3-control-indicator {
      ${({ disabled }) =>
        !disabled && `border: 1.5px solid ${Colors.DARK_GRAY}`};
      background-image: none;
      box-shadow: none;
      border: 1px solid ${Colors.GREY_3};
      border-radius: ${({ borderRadius }) => borderRadius};
    }
  }

  &.bp3-control input:checked ~ .bp3-control-indicator {
    background-image: none;
    background-color: ${({ backgroundColor }) => backgroundColor};
    &::before {
      background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='14' height='14' /%3E%3Cpath d='M10.1039 3.5L11 4.40822L5.48269 10L2.5 6.97705L3.39613 6.06883L5.48269 8.18305L10.1039 3.5Z' fill='white'/%3E%3C/svg%3E%0A") !important;
    }
  }

  &.bp3-control input:not(:disabled):active ~ .bp3-control-indicator {
    background: none;
  }

  &.bp3-control.bp3-checkbox
    input:disabled:indeterminate
    ~ .bp3-control-indicator {
    background: ${({ theme }) => theme.colors.checkbox.unchecked};
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
  backgroundColor: string;
  borderRadius: string;
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
            backgroundColor={props.backgroundColor}
            borderRadius={props.borderRadius}
            checked={(selectedValues || []).includes(option.value)}
            disabled={isDisabled}
            indeterminate={isDisabled ? true : undefined}
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

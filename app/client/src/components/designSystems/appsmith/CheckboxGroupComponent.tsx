import * as React from "react";
import styled from "styled-components";
import { Checkbox } from "@blueprintjs/core";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { ThemeProp } from "components/ads/common";

export interface CheckboxGroupContainerProps {
  inline?: boolean;
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
  justify-content: space-between;
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 1px solid transparent;
  ${({ theme, valid }) =>
    !valid &&
    `
    border: 1px solid ${theme.colors.error};
  `}
`;

export interface StyledCheckboxProps {
  disabled?: boolean;
}

const StyledCheckbox = styled(Checkbox)<ThemeProp & StyledCheckboxProps>`
  &.bp3-control input:checked ~ .bp3-control-indicator {
    box-shadow: none;
    background-image: none;
    background-color: #03b365;
  }

  &.bp3-control.bp3-checkbox .bp3-control-indicator {
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
  selectedValues: string[];
}

function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  const {
    isDisabled,
    isInline,
    isValid,
    onChange,
    options,
    selectedValues,
  } = props;

  return (
    <CheckboxGroupContainer inline={isInline} valid={isValid}>
      {options &&
        options.length > 0 &&
        [...options].map((option: OptionProps) => (
          <StyledCheckbox
            checked={(selectedValues || []).includes(option.value)}
            disabled={isDisabled}
            inline={isInline}
            key={option.value}
            label={option.label}
            onChange={onChange(option.value)}
          />
        ))}
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;

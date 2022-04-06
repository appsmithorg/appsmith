import React from "react";
import styled from "styled-components";

import { Classes } from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { ThemeProp } from "components/ads/common";
import { generateReactKey } from "utils/generators";
import { Colors } from "constants/Colors";

// TODO(abstraction-issue): this needs to be a common import from somewhere in the platform
// Alternatively, they need to be replicated.
import { StyledCheckbox } from "widgets/CheckboxWidget/component";
import { OptionProps, SelectAllState, SelectAllStates } from "../constants";

export interface CheckboxGroupContainerProps {
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
  optionAlignment?: string;
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
  justify-content: ${({ inline, optionAlignment, optionCount }) =>
    !!optionAlignment
      ? optionAlignment
      : optionCount > 1
      ? `space-between`
      : inline
      ? `flex-start`
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

  .${Classes.CONTROL} {
    display: flex;
    align-items: center;
    margin-bottom: 0;
    min-height: 36px;
    margin: 0px 12px;
  }

  & .bp3-control.bp3-checkbox {
    margin-top: ${({ inline, optionCount }) =>
      (inline || optionCount === 1) && `4px`};
  }

  & .select-all {
    white-space: nowrap;
    color: ${Colors.GREY_9} !important;
  }
`;

export interface SelectAllProps {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  inline?: boolean;
  onChange: React.FormEventHandler<HTMLInputElement>;
  rowSpace: number;
}
export interface StyledCheckboxProps {
  disabled?: boolean;
  optionCount: number;
  rowspace: number;
}

function SelectAll(props: SelectAllProps) {
  const {
    checked,
    disabled,
    indeterminate,
    inline,
    onChange,
    rowSpace,
  } = props;
  return (
    <StyledCheckbox
      checked={checked}
      className="select-all"
      disabled={disabled}
      indeterminate={indeterminate}
      inline={inline}
      label="Select All"
      onChange={onChange}
      rowSpace={rowSpace}
    />
  );
}

export interface CheckboxGroupComponentProps extends ComponentProps {
  isDisabled?: boolean;
  isInline?: boolean;
  isSelectAll?: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
  onSelectAllChange: (
    state: SelectAllState,
  ) => React.FormEventHandler<HTMLInputElement>;
  options: OptionProps[];
  rowSpace: number;
  selectedValues: string[];
  optionAlignment?: string;
}
function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  const {
    isDisabled,
    isInline,
    isSelectAll,
    isValid,
    onChange,
    onSelectAllChange,
    optionAlignment,
    options,
    rowSpace,
    selectedValues,
  } = props;

  const selectAllChecked = selectedValues.length === options.length;
  const selectAllIndeterminate =
    !selectAllChecked && selectedValues.length >= 1;
  const selectAllState = selectAllChecked
    ? SelectAllStates.CHECKED
    : selectAllIndeterminate
    ? SelectAllStates.INDETERMINATE
    : SelectAllStates.UNCHECKED;

  return (
    <CheckboxGroupContainer
      data-cy="checkbox-group-container"
      inline={isInline}
      optionAlignment={optionAlignment}
      optionCount={options.length}
      valid={isValid}
    >
      {isSelectAll && (
        <SelectAll
          checked={selectAllChecked}
          disabled={isDisabled}
          indeterminate={selectAllIndeterminate}
          inline={isInline}
          onChange={onSelectAllChange(selectAllState)}
          rowSpace={rowSpace}
        />
      )}
      {options &&
        options.length > 0 &&
        [...options].map((option: OptionProps) => (
          <StyledCheckbox
            checked={(selectedValues || []).includes(option.value)}
            disabled={isDisabled}
            indeterminate={isDisabled ? true : undefined}
            inline={isInline}
            key={generateReactKey()}
            label={option.label}
            onChange={onChange(option.value)}
            rowSpace={rowSpace}
          />
        ))}
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;

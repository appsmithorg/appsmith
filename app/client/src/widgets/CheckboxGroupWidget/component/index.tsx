import React from "react";
import styled from "styled-components";
import { Alignment } from "@blueprintjs/core";

import { Classes } from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { generateReactKey } from "utils/generators";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { TextSize } from "constants/WidgetConstants";

// TODO(abstraction-issue): this needs to be a common import from somewhere in the platform
// Alternatively, they need to be replicated.
import {
  CheckboxLabel,
  StyledCheckbox,
} from "widgets/CheckboxWidget/component";
import { OptionProps, SelectAllState, SelectAllStates } from "../constants";
import {
  LabelWithTooltip,
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "design-system";
import { ThemeProp, AlignWidgetTypes } from "widgets/constants";

export interface InputContainerProps {
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
  optionAlignment?: string;
}

const InputContainer = styled.div<ThemeProp & InputContainerProps>`
  display: ${({ inline }) => (inline ? "inline-flex" : "flex")};
  ${({ inline }) => `
    flex-direction: ${inline ? "row" : "column"};
    align-items:  "flex-start";
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
  height: ${({ inline }) => (inline ? "32px" : "100%")};
  flex-grow: 1;
  height: 100%;
  border: 1px solid transparent;

  .${Classes.CONTROL} {
    display: flex;
    align-items: center;
    margin-bottom: 0;
    min-height: 30px;

    .bp3-control-indicator {
      margin-top: 0 !important;
    }
  }
`;

export interface CheckboxGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const CheckboxGroupContainer = styled.div<CheckboxGroupContainerProps>`
  ${labelLayoutStyles}
  & .${LABEL_CONTAINER_CLASS} {
    ${({ labelPosition }) =>
      labelPosition === LabelPosition.Left && "min-height: 30px"};
  }
  & .select-all {
    white-space: nowrap;
  }
`;

export interface SelectAllProps {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  inline?: boolean;
  onChange: React.FormEventHandler<HTMLInputElement>;
  accentColor: string;
  borderRadius: string;
  isDisabled?: boolean;
}

function SelectAll(props: SelectAllProps) {
  const {
    accentColor,
    borderRadius,
    checked,
    disabled,
    indeterminate,
    inline,
    isDisabled,
    onChange,
  } = props;
  return (
    <StyledCheckbox
      accentColor={accentColor}
      borderRadius={borderRadius}
      checked={checked}
      className="select-all"
      disabled={disabled}
      indeterminate={indeterminate}
      inline={inline}
      labelElement={
        <CheckboxLabel
          alignment={AlignWidgetTypes.LEFT}
          className="t--checkbox-widget-label"
          disabled={isDisabled}
          labelTextColor={disabled ? Colors.GREY_8 : "inherit"}
        >
          Select all
        </CheckboxLabel>
      }
      onChange={onChange}
    />
  );
}

export interface CheckboxGroupComponentProps extends ComponentProps {
  isDisabled: boolean;
  isInline: boolean;
  isSelectAll?: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
  onSelectAllChange: (
    state: SelectAllState,
  ) => React.FormEventHandler<HTMLInputElement>;
  options: OptionProps[];

  selectedValues: string[];
  optionAlignment?: string;
  compactMode: boolean;
  labelText?: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  labelWidth?: number;
  accentColor: string;
  borderRadius: string;
}
function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  const {
    accentColor,
    borderRadius,
    compactMode,
    isDisabled,
    isInline,
    isSelectAll,
    isValid,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelWidth,
    onChange,
    onSelectAllChange,
    optionAlignment,
    options,
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

  let optionCount = (options || []).length;
  if (isSelectAll) {
    optionCount += 1;
  }

  return (
    <CheckboxGroupContainer
      compactMode={compactMode}
      data-testid="checkboxgroup-container"
      labelPosition={labelPosition}
    >
      {labelText && (
        <LabelWithTooltip
          alignment={labelAlignment}
          className={`checkboxgroup-label`}
          color={labelTextColor}
          compact={compactMode}
          disabled={isDisabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
          inline={isInline}
          optionCount={optionCount}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <InputContainer
        data-cy="checkbox-group-container"
        inline={isInline}
        optionAlignment={optionAlignment}
        optionCount={options.length}
      >
        {isSelectAll && (
          <SelectAll
            accentColor={accentColor}
            borderRadius={borderRadius}
            checked={selectAllChecked}
            disabled={isDisabled}
            indeterminate={selectAllIndeterminate}
            inline={isInline}
            onChange={onSelectAllChange(selectAllState)}
          />
        )}
        {options &&
          options.length > 0 &&
          [...options].map((option: OptionProps) => (
            <StyledCheckbox
              accentColor={accentColor}
              borderRadius={borderRadius}
              checked={(selectedValues || []).includes(option.value)}
              disabled={isDisabled}
              hasError={!isValid}
              inline={isInline}
              key={generateReactKey()}
              labelElement={
                <CheckboxLabel
                  alignment={AlignWidgetTypes.LEFT}
                  className="t--checkbox-widget-label"
                  disabled={isDisabled}
                >
                  {option.label}
                </CheckboxLabel>
              }
              onChange={onChange(option.value)}
            />
          ))}
      </InputContainer>
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;

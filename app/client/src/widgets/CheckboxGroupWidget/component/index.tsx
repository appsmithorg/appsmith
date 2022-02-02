import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Alignment, Label, Position } from "@blueprintjs/core";

import { Classes } from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { ThemeProp } from "components/ads/common";
import { generateReactKey } from "utils/generators";
import { Colors } from "constants/Colors";
import {
  LabelPosition,
  LabelPositionTypes,
  LABEL_MAX_WIDTH_RATE,
} from "components/constants";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import Tooltip from "components/ads/Tooltip";

// TODO(abstraction-issue): this needs to be a common import from somewhere in the platform
// Alternatively, they need to be replicated.
import { StyledCheckbox } from "widgets/CheckboxWidget/component";
import { OptionProps, SelectAllState, SelectAllStates } from "../constants";

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
    min-height: 30px;

    .bp3-control-indicator {
      margin-top: 0;
    }
  }
`;

export interface LabelContainerProps {
  inline: boolean;
  optionCount: number;
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}

export const LabelContainer = styled.div<LabelContainerProps>`
  display: flex;
  align-items: center;
  min-height: 30px;

  ${({ alignment, compactMode, inline, optionCount, position, width }) => `
    ${
      position !== LabelPositionTypes.Top &&
      (position === LabelPositionTypes.Left || compactMode)
        ? `&&& {margin-right: 5px;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `width: 100%;`
    }
    ${position === LabelPositionTypes.Left &&
      `
      label {
        ${width && `width: ${width}px`};
        ${
          alignment === Alignment.RIGHT
            ? `text-align: right`
            : `text-align: left`
        };
      }
    `}

    ${!inline && optionCount > 1 && `align-self: flex-start;`}
  `}
`;

export interface StyledLabelProps {
  disabled: boolean;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
}

export const StyledLabel = styled(Label)<StyledLabelProps>`
  ${({ disabled, labelStyle, labelTextColor, labelTextSize }) => `
    color: ${disabled ? Colors.GREY_8 : labelTextColor || "inherit"};
    font-size: ${labelTextSize ? TEXT_SIZES[labelTextSize] : "14px"};
    font-weight: ${
      labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"
    };
    font-style: ${
      labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : "normal"
    };
  `}
`;

export const StyledTooltip = styled(Tooltip)`
  overflow: hidden;
`;

export interface CheckboxGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const CheckboxGroupContainer = styled.div<CheckboxGroupContainerProps>`
  display: flex;
  ${({ compactMode, labelPosition }) => `
    flex-direction: ${
      labelPosition === LabelPositionTypes.Left
        ? "row"
        : labelPosition === LabelPositionTypes.Top
        ? "column"
        : compactMode
        ? "row"
        : "column"
    };
    align-items: ${
      labelPosition === LabelPositionTypes.Top
        ? `flex-start`
        : compactMode || labelPosition === LabelPositionTypes.Left
        ? `center`
        : `flex-start`
    };

    overflow-x: hidden;

    label.checkboxgroup-label {
      ${
        labelPosition === LabelPositionTypes.Top
          ? `margin-bottom: 5px; margin-right: 0px`
          : compactMode || labelPosition === LabelPositionTypes.Left
          ? `margin-bottom: 0px; margin-right: 5px`
          : `margin-bottom: 5px; margin-right: 0px`
      };
    }
  `}

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
  rowSpace: number;
  selectedValues: string[];
  optionAlignment?: string;
  compactMode: boolean;
  labelText?: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  labelWidth: number;
  width: number;
}
function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  const {
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
    rowSpace,
    selectedValues,
    widgetId,
    width,
  } = props;

  const [hasLabelEllipsis, setHasLabelEllipsis] = useState(false);

  useEffect(() => {
    setHasLabelEllipsis(checkHasLabelEllipsis());
  }, [width, labelText, labelPosition, labelWidth]);

  const checkHasLabelEllipsis = useCallback(() => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${widgetId} .checkboxgroup-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  }, []);
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
      labelPosition={labelPosition}
    >
      {labelText && (
        <LabelContainer
          alignment={labelAlignment}
          compactMode={compactMode}
          inline={isInline}
          optionCount={optionCount}
          position={labelPosition}
          width={labelWidth}
        >
          {hasLabelEllipsis ? (
            <StyledTooltip
              content={labelText}
              hoverOpenDelay={200}
              position={Position.TOP}
            >
              <StyledLabel
                className={`checkboxgroup-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
                disabled={isDisabled}
                labelStyle={labelStyle}
                labelTextColor={labelTextColor}
                labelTextSize={labelTextSize}
              >
                {labelText}
              </StyledLabel>
            </StyledTooltip>
          ) : (
            <StyledLabel
              className={`checkboxgroup-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
              disabled={isDisabled}
              labelStyle={labelStyle}
              labelTextColor={labelTextColor}
              labelTextSize={labelTextSize}
            >
              {labelText}
            </StyledLabel>
          )}
        </LabelContainer>
      )}
      <InputContainer
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
      </InputContainer>
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;

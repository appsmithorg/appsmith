import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Alignment, Checkbox, Label, Position } from "@blueprintjs/core";

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
  }
`;

export interface LabelContainerProps {
  inline: boolean;
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}

export const LabelContainer = styled.div<LabelContainerProps>`
  display: flex;
  ${({ alignment, compactMode, inline, position, width }) => `
    ${
      position !== LabelPositionTypes.Top &&
      (position === LabelPositionTypes.Left || compactMode)
        ? `&&& {margin-right: 5px; flex-shrink: 0;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `width: 100%;`
    }
    ${position === LabelPositionTypes.Left &&
      `${width && `width: ${width}px`}; ${alignment === Alignment.RIGHT &&
        `justify-content:  flex-end`};`}

    ${!inline && `align-self: flex-start;`}
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

    label {
      ${
        labelPosition === LabelPositionTypes.Top
          ? `margin-bottom: 5px; margin-right: 0px`
          : compactMode || labelPosition === LabelPositionTypes.Left
          ? `margin-bottom: 0px; margin-right: 5px`
          : `margin-bottom: 5px; margin-right: 0px`
      };
    }
  `}
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

    .bp3-control-indicator {
      margin-top: 0;
      ${({ disabled }) =>
        !disabled && `border: 1.5px solid ${Colors.DARK_GRAY}`};
      border-radius: 0;
      box-shadow: none;
    }
  }

  &.bp3-control input:checked ~ .bp3-control-indicator {
    border: none;
    background-image: none;
    background-color: ${({ theme }) =>
      theme.colors.button.primary.primary.bgColor};
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
  isDisabled: boolean;
  isInline: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
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
    isValid,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelWidth,
    onChange,
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
              optionCount={options.length}
              rowspace={rowSpace}
            />
          ))}
      </InputContainer>
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;

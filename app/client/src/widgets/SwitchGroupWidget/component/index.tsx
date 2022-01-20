import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Alignment, Classes, Label, Position, Switch } from "@blueprintjs/core";

import { ThemeProp } from "components/ads/common";
import { BlueprintControlTransform } from "constants/DefaultTheme";
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

export interface SwitchGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const SwitchGroupContainer = styled.div<SwitchGroupContainerProps>`
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

export interface InputContainerProps {
  alignment: Alignment;
  inline?: boolean;
  optionCount: number;
  valid?: boolean;
}

export const InputContainer = styled.div<ThemeProp & InputContainerProps>`
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
  ${BlueprintControlTransform}
`;

export interface StyledSwitchProps {
  rowSpace: number;
}

const StyledSwitch = styled(Switch)<ThemeProp & StyledSwitchProps>`
  height: ${({ rowSpace }) => rowSpace}px;

  &.bp3-control.bp3-switch {
    ${({ alignIndicator }) =>
      alignIndicator === Alignment.RIGHT && `margin-right: 0`};
    .bp3-control-indicator {
      margin-top: 0;
    }
    input:checked ~ .bp3-control-indicator,
    &:hover input:checked ~ .bp3-control-indicator {
      background-color: ${Colors.GREEN};
    }
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

export interface OptionProps {
  label?: string;
  value: string;
}

function SwitchGroupComponent(props: SwitchGroupComponentProps) {
  const {
    alignment,
    compactMode,
    disabled,
    inline,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelWidth,
    onChange,
    options,
    rowSpace,
    selected,
    valid,
    widgetId,
    width,
  } = props;

  const [hasLabelEllipsis, setHasLabelEllipsis] = useState(false);

  useEffect(() => {
    setHasLabelEllipsis(checkHasLabelEllipsis());
  }, [width, labelText, labelPosition, labelWidth]);

  const checkHasLabelEllipsis = useCallback(() => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${widgetId} .switchgroup-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  }, []);

  return (
    <SwitchGroupContainer
      compactMode={compactMode}
      labelPosition={labelPosition}
    >
      {labelText && (
        <LabelContainer
          alignment={labelAlignment}
          compactMode={compactMode}
          inline={inline}
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
                className={`switchgroup-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
                disabled={disabled}
                labelStyle={labelStyle}
                labelTextColor={labelTextColor}
                labelTextSize={labelTextSize}
              >
                {labelText}
              </StyledLabel>
            </StyledTooltip>
          ) : (
            <StyledLabel
              className={`switchgroup-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
              disabled={disabled}
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
              checked={selected.includes(option.value)}
              disabled={disabled}
              inline={inline}
              key={option.value}
              label={option.label}
              onChange={onChange(option.value)}
              rowSpace={rowSpace}
            />
          ))}
      </InputContainer>
    </SwitchGroupContainer>
  );
}

export interface SwitchGroupComponentProps {
  alignment: Alignment;
  disabled: boolean;
  inline: boolean;
  options: OptionProps[];
  onChange: (value: string) => React.FormEventHandler<HTMLInputElement>;
  required: boolean;
  rowSpace: number;
  selected: string[];
  valid?: boolean;
  compactMode: boolean;
  labelText?: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  labelWidth: number;
  widgetId: string;
  width: number;
}

export default SwitchGroupComponent;

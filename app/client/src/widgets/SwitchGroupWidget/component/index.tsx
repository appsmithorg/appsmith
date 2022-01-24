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

    label.switchgroup-label {
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
  compactMode: boolean;
  inline: boolean;
  optionCount: number;
  scrollable: boolean;
  valid?: boolean;
}

export const InputContainer = styled.div<ThemeProp & InputContainerProps>`
  display: block;
  border: 1px solid transparent;

  ${({ inline, optionCount }) =>
    !inline && optionCount > 1 && `align-self: flex-start`};
  ${({ compactMode, inline, optionCount, scrollable }) =>
    inline && compactMode && optionCount > 1 && scrollable && `height: 100%`};

  ${({ theme, valid }) =>
    !valid &&
    `
    border: 1px solid ${theme.colors.error};
  `}
  ${BlueprintControlTransform}
  .${Classes.CONTROL} {
    margin-bottom: 0;
    border: 1px solid transparent;
    color: ${Colors.GREY_10};

    ${({ alignment, inline }) =>
      (inline || alignment === Alignment.RIGHT) && `line-height: 16px`};

    ${({ alignment, inline }) =>
      alignment === Alignment.RIGHT &&
      (inline ? `display: inline-block` : `display: block`)};

    .bp3-control-indicator {
      margin-top: 0;
      border: 1px solid ${Colors.GREY_3};
    }
    input:checked ~ .bp3-control-indicator,
    &:hover input:checked ~ .bp3-control-indicator {
      background-color: ${Colors.GREEN};
    }

    &:hover {
      & input:not(:checked) ~ .bp3-control-indicator {
        border: 1px solid ${Colors.GREY_5} !important;
      }
    }

    ${({ alignment, inline, optionCount, scrollable }) =>
      (scrollable || (!inline && optionCount > 1)) &&
      (alignment === Alignment.LEFT
        ? `margin-bottom: 16px`
        : `min-height: 30px`)};

    ${({ compactMode, inline, optionCount }) =>
      (inline || optionCount === 1) && compactMode && `margin-bottom: 0`};
  }
`;

export interface StyledSwitchProps {
  alignIndicator: Alignment;
  inline: boolean;
}

const StyledSwitch = styled(Switch)<ThemeProp & StyledSwitchProps>`
  line-height: 16px;
  &.bp3-control.bp3-switch {
    ${({ alignIndicator, inline }) =>
      alignIndicator === Alignment.RIGHT &&
      (inline ? `display: inline-block` : `display: block`)};

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
  optionCount: number;
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}

export const LabelContainer = styled.div<LabelContainerProps>`
  display: flex;
  ${({ alignment, compactMode, inline, optionCount, position, width }) => `
    ${
      position !== LabelPositionTypes.Top &&
      (position === LabelPositionTypes.Left || compactMode)
        ? `&&& {margin-right: 5px;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `width: 100%;`
    }
    ${position === LabelPositionTypes.Left &&
      `${width && `width: ${width}px`}; ${alignment === Alignment.RIGHT &&
        `justify-content:  flex-end`};`}

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

export interface OptionProps {
  label?: string;
  value: string;
}

function SwitchGroupComponent(props: SwitchGroupComponentProps) {
  const {
    alignment,
    compactMode,
    disabled,
    height,
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
    selected,
    valid,
    widgetId,
    width,
  } = props;

  const [hasLabelEllipsis, setHasLabelEllipsis] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  const containerRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    setHasLabelEllipsis(checkHasLabelEllipsis());
  }, [width, height, labelText, labelPosition, labelWidth]);

  useEffect(() => {
    const containerElement = containerRef.current;
    if (
      containerElement &&
      containerElement.scrollHeight > containerElement.clientHeight
    ) {
      setScrollable(true);
    } else {
      setScrollable(false);
    }
  }, [
    height,
    width,
    inline,
    JSON.stringify(options),
    labelText,
    labelPosition,
    labelWidth,
  ]);

  const checkHasLabelEllipsis = useCallback(() => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${widgetId} .switchgroup-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  }, []);

  const optionCount = (options || []).length;

  return (
    <SwitchGroupContainer
      compactMode={compactMode}
      labelPosition={labelPosition}
      ref={containerRef}
    >
      {labelText && (
        <LabelContainer
          alignment={labelAlignment}
          compactMode={compactMode}
          inline={inline}
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
        compactMode={compactMode}
        inline={inline}
        optionCount={optionCount}
        scrollable={scrollable}
        valid={valid}
      >
        {Array.isArray(options) &&
          options.length > 0 &&
          options.map((option: OptionProps) => (
            <Switch
              alignIndicator={alignment}
              checked={selected.includes(option.value)}
              disabled={disabled}
              inline={inline}
              key={option.value}
              label={option.label}
              onChange={onChange(option.value)}
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
  height: number;
  width: number;
}

export default SwitchGroupComponent;

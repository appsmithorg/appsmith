import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Alignment, Classes, Switch } from "@blueprintjs/core";

import { ThemeProp } from "components/ads/common";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { TextSize } from "constants/WidgetConstants";
import LabelWithTooltip from "components/ads/LabelWithTooltip";

export interface SwitchGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const SwitchGroupContainer = styled.div<SwitchGroupContainerProps>`
  display: flex;
  flex-direction: ${({ compactMode, labelPosition }) => {
    if (labelPosition === LabelPosition.Left) return "row";
    if (labelPosition === LabelPosition.Top) return "column";
    if (compactMode) return "row";
    return "column";
  }};

  align-items: ${({ compactMode, labelPosition }) => {
    if (labelPosition === LabelPosition.Top) return "flex-start";
    if (compactMode || labelPosition === LabelPosition.Left) return "center";
    return "flex-start";
  }};

  overflow-x: hidden;
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
    width,
  } = props;

  const [scrollable, setScrollable] = useState(false);

  const containerRef = React.createRef<HTMLDivElement>();

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

  const optionCount = (options || []).length;

  return (
    <SwitchGroupContainer
      compactMode={compactMode}
      data-testid="switchgroup-container"
      labelPosition={labelPosition}
      ref={containerRef}
    >
      {labelText && (
        <LabelWithTooltip
          alignment={labelAlignment}
          className={`switchgroup-label`}
          color={labelTextColor}
          compact={compactMode}
          disabled={disabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
          inline={inline}
          optionCount={optionCount}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
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
              checked={(selected || []).includes(option.value)}
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
  labelWidth?: number;
  widgetId: string;
  height: number;
  width: number;
}

export default SwitchGroupComponent;

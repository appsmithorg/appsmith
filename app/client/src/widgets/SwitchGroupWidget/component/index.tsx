import React from "react";
import styled from "styled-components";
import { Alignment } from "@blueprintjs/core";
import { BlueprintRadioSwitchGroupTransform } from "constants/DefaultTheme";
import { LabelPosition } from "components/constants";
import { TextSize } from "constants/WidgetConstants";
import { StyledSwitch } from "widgets/SwitchWidget/component";
import LabelWithTooltip, {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "widgets/components/LabelWithTooltip";
import { ThemeProp } from "widgets/constants";

export interface SwitchGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const SwitchGroupContainer = styled.div<SwitchGroupContainerProps>`
  ${labelLayoutStyles}
  & .${LABEL_CONTAINER_CLASS} {
    align-self: center;
    ${({ labelPosition }) =>
      labelPosition === LabelPosition.Left && "min-height: 30px"};
  }
`;

export interface InputContainerProps {
  alignment: Alignment;
  compactMode: boolean;
  height?: number;
  inline: boolean;
  labelPosition?: LabelPosition;
  optionCount: number;
  valid?: boolean;
  isDynamicHeightEnabled?: boolean;
}

export const InputContainer = styled.div<ThemeProp & InputContainerProps>`
  ${BlueprintRadioSwitchGroupTransform};

  border: 1px solid transparent;
  ${({ theme, valid }) =>
    !valid &&
    `
    border: 1px solid ${theme.colors.error};
  `}
`;

export interface OptionProps {
  label?: string;
  value: string;
}

function SwitchGroupComponent(props: SwitchGroupComponentProps) {
  const {
    accentColor,
    alignment,
    compactMode,
    disabled,
    height,
    inline,
    isDynamicHeightEnabled,
    labelAlignment,
    labelPosition,
    labelStyle,
    labelText,
    labelTextColor,
    labelTextSize,
    labelTooltip,
    labelWidth,
    onChange,
    options,
    selected,
    valid,
  } = props;

  const optionCount = (options || []).length;

  return (
    <SwitchGroupContainer
      compactMode={compactMode}
      data-testid="switchgroup-container"
      labelPosition={labelPosition}
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
          helpText={labelTooltip}
          inline={inline}
          isDynamicHeightEnabled={isDynamicHeightEnabled}
          optionCount={optionCount}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <InputContainer
        alignment={alignment}
        compactMode={compactMode}
        height={height}
        inline={inline}
        isDynamicHeightEnabled={isDynamicHeightEnabled}
        labelPosition={labelPosition}
        optionCount={optionCount}
        valid={valid}
      >
        {Array.isArray(options) &&
          options.length > 0 &&
          options.map((option: OptionProps) => (
            <StyledSwitch
              $accentColor={accentColor}
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
  isDynamicHeightEnabled?: boolean;
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
  labelTooltip?: string;
  widgetId: string;
  height: number;
  accentColor: string;
}

export default SwitchGroupComponent;

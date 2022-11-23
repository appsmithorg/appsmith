import React, { useCallback } from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { RadioGroup, Radio, Alignment, Classes } from "@blueprintjs/core";
import { TextSize } from "constants/WidgetConstants";
import { BlueprintRadioSwitchGroupTransform } from "constants/DefaultTheme";
import { LabelPosition } from "components/constants";
import { RadioOption } from "../constants";
import LabelWithTooltip, {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "widgets/components/LabelWithTooltip";

export interface RadioGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const RadioGroupContainer = styled.div<RadioGroupContainerProps>`
  ${labelLayoutStyles}

  & .${LABEL_CONTAINER_CLASS} {
    align-self: center;
    ${({ labelPosition }) =>
      labelPosition === LabelPosition.Left && "min-height: 30px"};
  }
`;

export interface StyledRadioGroupProps {
  alignment: Alignment;
  compactMode: boolean;
  height?: number;
  inline: boolean;
  labelPosition?: LabelPosition;
  optionCount: number;
  accentColor: string;
  isDynamicHeightEnabled?: boolean;
}

const StyledRadioGroup = styled(RadioGroup)<StyledRadioGroupProps>`
  ${BlueprintRadioSwitchGroupTransform}

  .${Classes.CONTROL} {
    & input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ accentColor }) => `${accentColor}`} !important;
      border: 1px solid ${({ accentColor }) => `${accentColor}`} !important;
    }

    & input:disabled:checked ~ .${Classes.CONTROL_INDICATOR} {
      &:before {
        opacity: 1;
        background-image: radial-gradient(
          var(--wds-color-bg-disabled-strong),
          var(--wds-color-bg-disabled-strong) 28%,
          transparent 32%
        );
      }
    }
  }

  .${Classes.SWITCH} {
    & input:not(:disabled):active:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ accentColor }) => `${accentColor}`};
    }
  }
`;

function RadioGroupComponent(props: RadioGroupComponentProps) {
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
    loading,
    onRadioSelectionChange,
    options,
    required,
    selectedOptionValue,
  } = props;

  const optionCount = (options || []).length;

  const handleChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      onRadioSelectionChange(event.currentTarget.value);
    },
    [onRadioSelectionChange],
  );

  return (
    <RadioGroupContainer
      compactMode={compactMode}
      data-testid="radiogroup-container"
      labelPosition={labelPosition}
    >
      {labelText && (
        <LabelWithTooltip
          alignment={labelAlignment}
          className={`radiogroup-label`}
          color={labelTextColor}
          compact={compactMode}
          disabled={disabled}
          fontSize={labelTextSize}
          fontStyle={labelStyle}
          helpText={labelTooltip}
          inline={inline}
          isDynamicHeightEnabled={isDynamicHeightEnabled}
          loading={loading}
          optionCount={optionCount}
          position={labelPosition}
          text={labelText}
          width={labelWidth}
        />
      )}
      <StyledRadioGroup
        accentColor={accentColor}
        alignment={alignment}
        compactMode={compactMode}
        disabled={disabled}
        height={height}
        inline={inline}
        isDynamicHeightEnabled={isDynamicHeightEnabled}
        labelPosition={labelPosition}
        onChange={handleChange}
        optionCount={options.length}
        selectedValue={selectedOptionValue}
      >
        {options.map((option, optInd) => {
          return (
            <Radio
              alignIndicator={alignment}
              className={loading ? "bp3-skeleton" : ""}
              inline={inline}
              key={optInd}
              label={option.label}
              required={required}
              value={option.value}
            />
          );
        })}
      </StyledRadioGroup>
    </RadioGroupContainer>
  );
}

export interface RadioGroupComponentProps extends ComponentProps {
  options: RadioOption[];
  onRadioSelectionChange: (updatedOptionValue: string) => void;
  selectedOptionValue: string;
  disabled: boolean;
  loading: boolean;
  isDynamicHeightEnabled?: boolean;
  inline: boolean;
  alignment: Alignment;
  compactMode: boolean;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  labelWidth?: number;
  labelTooltip?: string;
  widgetId: string;
  height?: number;
  accentColor: string;
  required?: boolean;
}

export default RadioGroupComponent;

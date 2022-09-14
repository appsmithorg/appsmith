import { Alignment, Classes, Switch } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { AlignWidgetTypes } from "widgets/constants";
import { Colors } from "constants/Colors";
import { FontStyleTypes } from "constants/WidgetConstants";
import { darkenColor } from "widgets/WidgetUtils";

export interface SwitchComponentProps extends ComponentProps {
  label: string;
  isSwitchedOn: boolean;
  onChange: (isSwitchedOn: boolean) => void;
  isLoading: boolean;
  alignWidget: AlignWidgetTypes;
  labelPosition: LabelPosition;
  accentColor: string;
  inputRef?: (ref: HTMLInputElement | null) => any;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}

const SwitchComponentContainer = styled.div<{
  accentColor: string;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  ${BlueprintControlTransform}
`;

const SwitchLabel = styled.div<{
  disabled?: boolean;
  labelPosition: LabelPosition;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}>`
  width: 100%;
  display: inline-block;
  vertical-align: top;
  text-align: ${({ labelPosition }) => labelPosition.toLowerCase()};
  ${({ disabled, labelStyle, labelTextColor, labelTextSize }) => `
  color: ${disabled ? Colors.GREY_8 : labelTextColor || "inherit"};
  font-size: ${labelTextSize ?? "inherit"};
  font-weight: ${labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${
    labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : "normal"
  };
  `}
`;

export const StyledSwitch = styled(Switch)<{
  accentColor: string;
  inline?: boolean;
}>`
  &.${Classes.CONTROL} {
    margin: 0;
  }

  &.${Classes.CONTROL} {
    & input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ accentColor }) => `${accentColor}`} !important;
      border: 1px solid ${({ accentColor }) => `${accentColor}`} !important;
    }

    &:hover input:checked:not(:disabled) ~ .bp3-control-indicator {
      background: ${({ accentColor }) =>
        `${darkenColor(accentColor)}`} !important;
      border: 1px solid ${({ accentColor }) =>
        `${darkenColor(accentColor)}`} !important;
    }
  }

  &.${Classes.SWITCH} {
    ${({ inline }) => (!!inline ? "" : "width: 100%;")}
    & input:not(:disabled):active:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ accentColor }) => `${accentColor}`} !important;
    }
  }
`;

export default function SwitchComponent({
  accentColor,
  alignWidget,
  inputRef,
  isDisabled,
  isLoading,
  isSwitchedOn,
  label,
  labelPosition,
  labelStyle,
  labelTextColor,
  labelTextSize,
  onChange,
}: SwitchComponentProps) {
  const switchAlignClass =
    alignWidget === AlignWidgetTypes.RIGHT ? Alignment.RIGHT : Alignment.LEFT;

  return (
    <SwitchComponentContainer accentColor={accentColor}>
      <StyledSwitch
        accentColor={accentColor}
        alignIndicator={switchAlignClass}
        checked={isSwitchedOn}
        className={
          isLoading
            ? `${Classes.SKELETON} t--switch-widget-loading`
            : `${
                isSwitchedOn
                  ? "t--switch-widget-active"
                  : "t--switch-widget-inactive"
              }`
        }
        disabled={isDisabled}
        inputRef={inputRef}
        labelElement={
          <SwitchLabel
            className="t--switch-widget-label"
            disabled={isDisabled}
            labelPosition={labelPosition}
            labelStyle={labelStyle}
            labelTextColor={labelTextColor}
            labelTextSize={labelTextSize}
          >
            {label}
          </SwitchLabel>
        }
        onChange={() => onChange(!isSwitchedOn)}
      />
    </SwitchComponentContainer>
  );
}

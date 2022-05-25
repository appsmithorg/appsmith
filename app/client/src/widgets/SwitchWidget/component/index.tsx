import { Alignment, Classes, Switch } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { AlignWidget } from "widgets/constants";

export interface SwitchComponentProps extends ComponentProps {
  label: string;
  isSwitchedOn: boolean;
  onChange: (isSwitchedOn: boolean) => void;
  isLoading: boolean;
  alignWidget: AlignWidget;
  accentColor: string;
  inputRef?: (ref: HTMLInputElement | null) => any;
}

const SwitchComponentContainer = styled.div<{
  accentColor: string;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  &.${Alignment.RIGHT} {
    justify-content: flex-end;
  }
  ${BlueprintControlTransform}
`;

export const StyledSwitch = styled(Switch)<{
  accentColor: string;
}>`
  &.${Classes.CONTROL} {
    margin: 0;
  }

  &.${Classes.CONTROL} {
    & input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${({ accentColor }) => `${accentColor}`} !important;
      border: 1px solid ${({ accentColor }) => `${accentColor}`} !important;
    }
  }

  &.${Classes.SWITCH} {
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
  onChange,
}: SwitchComponentProps) {
  const switchAlignClass =
    alignWidget === "RIGHT" ? Alignment.RIGHT : Alignment.LEFT;

  return (
    <SwitchComponentContainer
      accentColor={accentColor}
      className={switchAlignClass}
    >
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
        label={label}
        onChange={() => onChange(!isSwitchedOn)}
      />
    </SwitchComponentContainer>
  );
}

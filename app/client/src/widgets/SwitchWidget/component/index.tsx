import { Alignment, Classes, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { AlignWidget } from "widgets/constants";

interface SwitchComponentProps extends ComponentProps {
  label: string;
  isSwitchedOn: boolean;
  onChange: (isSwitchedOn: boolean) => void;
  isLoading: boolean;
  alignWidget: AlignWidget;
}

const SwitchComponentContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  &&& .${Classes.CONTROL} {
    margin: 0;
    input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${Colors.GREEN};
      border: 1px solid ${Colors.GREEN};
    }
  }
  &.${Alignment.RIGHT} {
    justify-content: flex-end;
  }
  ${BlueprintControlTransform}
`;

export function SwitchComponent({
  alignWidget,
  isDisabled,
  isLoading,
  isSwitchedOn,
  label,
  onChange,
}: SwitchComponentProps) {
  const switchAlignClass =
    alignWidget === "RIGHT" ? Alignment.RIGHT : Alignment.LEFT;

  return (
    <SwitchComponentContainer className={switchAlignClass}>
      <Switch
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
        label={label}
        onChange={() => onChange(!isSwitchedOn)}
      />
    </SwitchComponentContainer>
  );
}

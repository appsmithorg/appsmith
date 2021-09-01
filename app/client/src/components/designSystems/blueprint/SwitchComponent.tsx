import { Alignment, Classes, Switch } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import { AlignWidget } from "widgets/SwitchWidget";
import { ComponentProps } from "../appsmith/BaseComponent";

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
  .${Classes.CONTROL} {
    margin: 0;
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

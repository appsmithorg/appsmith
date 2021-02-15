import { Alignment, Classes, Switch } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import { ComponentProps } from "../appsmith/BaseComponent";

interface SwitchComponentProps extends ComponentProps {
  label: string;
  isSwitchedOn: boolean;
  onChange: (isSwitchedOn: boolean) => void;
  isLoading: boolean;
  swapLabel: boolean;
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

export const SwitchComponent: React.FC<SwitchComponentProps> = ({
  label,
  isSwitchedOn,
  swapLabel,
  onChange,
  isDisabled,
  isLoading,
}) => {
  const switchAlignClass = swapLabel ? Alignment.RIGHT : Alignment.LEFT;

  return (
    <SwitchComponentContainer className={switchAlignClass}>
      <Switch
        alignIndicator={switchAlignClass}
        label={label}
        disabled={isDisabled}
        className={isLoading ? Classes.SKELETON : ""}
        checked={isSwitchedOn}
        onChange={() => onChange(!isSwitchedOn)}
      />
    </SwitchComponentContainer>
  );
};

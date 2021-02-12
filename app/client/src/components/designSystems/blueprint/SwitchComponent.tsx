import { Alignment, Switch } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";
import { ComponentProps } from "../appsmith/BaseComponent";

interface SwitchComponentProps extends ComponentProps {
  label: string;
  isOn: boolean;
  onSwitchChange: (isOn: boolean) => void;
  isLoading: boolean;
  swapLabel: boolean;
}

const SwitchComponentContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  .bp3-control {
    margin: 0;
  }
  ${BlueprintControlTransform}
`;

export const SwitchComponent: React.FC<SwitchComponentProps> = ({
  label,
  isOn,
  swapLabel,
  onSwitchChange,
  isDisabled,
  isLoading,
}) => {
  return (
    <>
      {
        <SwitchComponentContainer>
          <Switch
            alignIndicator={
              label && swapLabel ? Alignment.RIGHT : Alignment.LEFT
            }
            label={label}
            disabled={isDisabled}
            className={isLoading ? "bp3-skeleton" : ""}
            checked={isOn}
            onChange={() => onSwitchChange(!isOn)}
          />
        </SwitchComponentContainer>
      }
    </>
  );
};

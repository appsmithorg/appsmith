import { Classes, Switch } from "@blueprintjs/core";
import React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";

interface SwitchComponentProps extends ComponentProps {
  label: string;
  isOn: boolean;
  onSwitchChange: (isChecked: boolean) => void;
  isLoading: boolean;
  isRequired?: boolean;
}

export const SwitchComponent: React.FC<SwitchComponentProps> = ({
  label,
  isOn,
  onSwitchChange,
  isLoading,
  isRequired = true,
}) => {
  return (
    <>
      {isRequired && (
        <>
          {label}{" "}
          <Switch
            className={isLoading ? "bp3-skeleton" : Classes.RUNNING_TEXT}
            checked={isOn}
            onChange={() => onSwitchChange(!isOn)}
          />
        </>
      )}
    </>
  );
};

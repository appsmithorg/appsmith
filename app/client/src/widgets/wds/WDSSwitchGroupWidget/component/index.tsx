import React from "react";
import { SwitchGroup, Switch } from "@design-system/widgets";
import type { SwitchGroupComponentProps } from "./types";
import type { OptionProps } from "../widget/types";

export const SwitchGroupComponent = (props: SwitchGroupComponentProps) => {
  return (
    <SwitchGroup
      isDisabled={props.isDisabled}
      isRequired={props.isRequired}
      label={props.labelText}
      onChange={props.onChange}
      orientation={props.orientation}
      value={props.selectedValues}
    >
      {props.options.map((option: OptionProps, index: number) => {
        return (
          <Switch
            key={`${props.widgetId}-switch-${index}`}
            labelPosition={props.labelPosition}
            validationState={props.isValid ? "valid" : "invalid"}
            value={option.value}
          >
            {option.label}
          </Switch>
        );
      })}
    </SwitchGroup>
  );
};

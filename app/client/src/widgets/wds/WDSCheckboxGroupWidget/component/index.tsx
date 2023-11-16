import React from "react";
import { CheckboxGroup, Checkbox } from "@design-system/widgets";
import type { CheckboxGroupComponentProps } from "./types";
import type { OptionProps } from "../widget/types";

export const CheckboxGroupComponent = (props: CheckboxGroupComponentProps) => {
  return (
    <CheckboxGroup
      isDisabled={props.isDisabled}
      isRequired={props.isRequired}
      label={props.labelText}
      onChange={props.onChange}
      orientation={props.orientation}
      value={props.selectedValues}
    >
      {props.options.map((option: OptionProps, index: number) => {
        return (
          <Checkbox
            key={`${props.widgetId}-checkbox-${index}`}
            labelPosition={props.labelPosition}
            validationState={props.isValid ? "valid" : "invalid"}
            value={option.value}
          >
            {option.label}
          </Checkbox>
        );
      })}
    </CheckboxGroup>
  );
};

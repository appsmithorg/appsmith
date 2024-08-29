import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { Radio, RadioGroup, type SelectOptionProps } from "@appsmith/ads";

class RadioButtonControl extends BaseControl<RadioButtonControlProps> {
  getControlType(): ControlType {
    return "RADIO_BUTTON";
  }
  render() {
    return (
      <Field
        component={renderComponent}
        name={this.props.configProperty}
        props={{ ...this.props }}
        type="radiobutton"
      />
    );
  }
}

type renderComponentProps = RadioButtonControlProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  options?: Array<{ label: string; value: string }>;
};

function renderComponent(props: renderComponentProps) {
  const onChangeHandler = (value: string) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  const options = props.options || [];
  const defaultValue = props.initialValue as string;

  return (
    <RadioGroup
      data-testid={props?.input?.name}
      defaultValue={defaultValue}
      onChange={onChangeHandler}
    >
      {options.map((option) => {
        return (
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
        );
      })}
    </RadioGroup>
  );
}
export interface RadioButtonControlProps extends ControlProps {
  options: SelectOptionProps[];
}

export default RadioButtonControl;

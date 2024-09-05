import React from "react";
import type { CheckboxProps } from "@appsmith/ads";
import { Checkbox } from "@appsmith/ads";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";

class CheckboxControl extends BaseControl<CheckboxControlProps> {
  getControlType(): ControlType {
    return "CHECKBOX";
  }
  render() {
    return (
      <Field
        component={renderComponent}
        name={this.props.configProperty}
        props={{ ...this.props }}
        type="checkbox"
      />
    );
  }
}

type renderComponentProps = CheckboxProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
};

function renderComponent(props: renderComponentProps) {
  const onChangeHandler = (value: boolean) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  return (
    <Checkbox
      data-testid={props?.input?.name}
      isDefaultSelected={props?.input?.checked as boolean}
      isSelected={props?.input?.checked as boolean}
      {...props}
      name={props?.input?.name}
      onChange={onChangeHandler}
    />
  );
}
export interface CheckboxControlProps extends ControlProps {
  info?: string;
}

export default CheckboxControl;

import React from "react";
import Checkbox, { CheckboxProps } from "components/ads/Checkbox";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import CheckboxField from "components/editorComponents/form/fields/CheckboxField";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import styled from "styled-components";

const StyledCheckbox = styled(Checkbox)``;

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

type renderComponentProps = CheckboxControlProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  // props: CheckboxControlProps;
};

function renderComponent(props: renderComponentProps) {
  const onChangeHandler = (value: boolean) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  return (
    <StyledCheckbox
      isDefaultChecked={props?.input?.checked as boolean}
      {...props}
      info={undefined}
      label={""}
      onCheckChange={onChangeHandler}
    />
  );
}
export interface CheckboxControlProps extends ControlProps {
  info?: string;
}

export default CheckboxControl;

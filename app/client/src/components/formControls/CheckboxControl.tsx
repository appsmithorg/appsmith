import React from "react";
import Checkbox, { CheckboxProps } from "components/ads/Checkbox";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import styled from "styled-components";

const StyledCheckbox = styled(Checkbox)`
  span {
    margin: 0px 10px: 
  }
`;

class CheckboxControl extends BaseControl<CheckboxControlProps> {
  getControlType(): ControlType {
    return "CHECKBOX";
  }
  render() {
    return (
      <Field component={renderComponent} props={this.props} type="checkbox" />
    );
  }
}

type renderComponentProps = CheckboxProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  props: CheckboxControlProps;
};

function renderComponent(props: renderComponentProps) {
  const onChangeHandler = (value: boolean) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  /* eslint-disable no-console*/
  // console.log("rai", Object.keys(props));
  return (
    <StyledCheckbox
      info={""}
      isDefaultChecked={props.props?.initialValue as boolean}
      label={""}
      onCheckChange={onChangeHandler}
    />
  );
}
export interface CheckboxControlProps extends ControlProps {
  info?: string;
}

export default CheckboxControl;

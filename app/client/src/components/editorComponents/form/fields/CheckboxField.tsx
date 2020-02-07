import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import Checkbox, { CheckboxProps } from "components/editorComponents/Checkbox";

export const CheckboxField = (props: BaseFieldProps & CheckboxProps) => {
  return (
    <Field type="checkbox" component={Checkbox} name={props.name} {...props} />
  );
};

export default CheckboxField;

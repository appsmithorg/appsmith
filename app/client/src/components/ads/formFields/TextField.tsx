import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import InputComponent, { InputType } from "../TextInput";
import { Intent } from "constants/DefaultTheme";
import FormFieldError from "./FieldError";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;

  return (
    <React.Fragment>
      <InputComponent {...componentProps} {...componentProps.input} fill />
      <FormFieldError error={showError && componentProps.meta.error} />
    </React.Fragment>
  );
};

type FormTextFieldProps = {
  name: string;
  placeholder: string;
  type?: InputType;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
};

const FormTextField = (props: FormTextFieldProps) => {
  return (
    <React.Fragment>
      <Field component={renderComponent} {...props} asyncControl />
    </React.Fragment>
  );
};

export default FormTextField;

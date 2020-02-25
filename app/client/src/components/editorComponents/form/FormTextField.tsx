import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import InputComponent, {
  InputType,
} from "components/editorComponents/InputComponent";
import { Intent } from "constants/DefaultTheme";
import FormFieldError from "components/editorComponents/form/FieldError";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  return (
    <React.Fragment>
      <InputComponent {...componentProps} />
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
  helperText?: string;
};

const FormTextField = (props: FormTextFieldProps) => {
  return (
    <React.Fragment>
      <Field component={renderComponent} {...props} />
    </React.Fragment>
  );
};

export default FormTextField;

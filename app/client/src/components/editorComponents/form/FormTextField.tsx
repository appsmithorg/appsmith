import React from "react";

import type { InputType } from "components/editorComponents/InputComponent";
import InputComponent from "components/editorComponents/InputComponent";
import FormFieldError from "components/editorComponents/form/FieldError";
import type { Intent } from "constants/DefaultTheme";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  return (
    <>
      <InputComponent {...componentProps} />
      <FormFieldError error={showError && componentProps.meta.error} />
    </>
  );
};

interface FormTextFieldProps {
  name: string;
  placeholder: string;
  type?: InputType;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
}

// trigger tests
function FormTextField(props: FormTextFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default FormTextField;

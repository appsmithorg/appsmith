/**
 * Story not added to the storybook since redux dependency.
 * TODO: Add story.
 */
import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import type { InputType } from "../TextInput";
import InputComponent from "../TextInput";
import FormFieldError from "FieldError";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;

  return (
    <>
      <InputComponent {...componentProps} {...componentProps.input} fill />
      {!componentProps.hideErrorMessage &&
        showError &&
        componentProps.meta.error && (
          <FormFieldError error={showError && componentProps.meta.error} />
        )}
    </>
  );
};

export interface FormTextFieldProps {
  name: string;
  placeholder: string;
  type?: InputType;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
}

function FormTextField(props: FormTextFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default FormTextField;

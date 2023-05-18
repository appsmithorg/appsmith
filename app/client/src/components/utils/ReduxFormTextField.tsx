import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import type { InputType } from "design-system-old";
import { Input } from "design-system";
import type { Intent } from "constants/DefaultTheme";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;

  return (
    <Input
      {...componentProps}
      {...componentProps.input}
      errorMessage={showError && componentProps.meta.error}
      isValid={componentProps.hideErrorMessage && !showError}
    />
  );
};

export type FormTextFieldProps = {
  name: string;
  placeholder: string;
  type?: InputType;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
  size?: string;
};

function ReduxFormTextField(props: FormTextFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default ReduxFormTextField;

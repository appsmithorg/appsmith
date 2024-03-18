import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import type { InputType } from "design-system-old";
import { Input, NumberInput } from "design-system";

import type { Intent } from "constants/DefaultTheme";
import { SettingSubtype } from "@appsmith/pages/AdminSettings/config/types";
import { omit } from "lodash";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const value = componentProps.input.value || componentProps.defaultValue;
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  return componentProps.type === SettingSubtype.NUMBER ? (
    <NumberInput
      {...omit(componentProps, "type")}
      {...componentProps.input}
      errorMessage={
        !componentProps.hideErrorMessage && componentProps.meta.error
      }
      isDisabled={componentProps.disabled}
      label={componentProps.label as string}
      value={value}
    />
  ) : (
    <Input
      {...componentProps.input}
      {...componentProps}
      errorMessage={
        !componentProps.hideErrorMessage &&
        showError &&
        componentProps.meta.error
      }
      isDisabled={componentProps.disabled}
      renderAs={"input"}
      size="md"
      value={value}
    />
  );
};

export interface FormTextFieldProps {
  name: string;
  placeholder: string;
  description?: string;
  type?: InputType;
  label?: React.ReactNode;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
  isRequired?: boolean;
  defaultValue?: string;
  format?: (value: any) => any;
  parse?: (value: any) => any;
}

function ReduxFormTextField(props: FormTextFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default ReduxFormTextField;

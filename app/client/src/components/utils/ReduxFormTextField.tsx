import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import { Input, NumberInput } from "@appsmith/ads";

import type { Intent } from "constants/DefaultTheme";
import { SettingSubtype } from "ee/pages/AdminSettings/config/types";
import { omit } from "lodash";

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const value = componentProps.input.value || componentProps.defaultValue || "";
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
      // type prop is omitted as textarea component doesn't support that
      {...(componentProps.type === "textarea"
        ? omit(componentProps, "type")
        : componentProps)}
      errorMessage={
        !componentProps.hideErrorMessage &&
        showError &&
        componentProps.meta.error
      }
      isDisabled={componentProps.disabled}
      postfix={componentProps.postfix}
      renderAs={componentProps.type === "textarea" ? "textarea" : "input"}
      size="md"
      value={value}
    />
  );
};

export interface FormTextFieldProps {
  name: string;
  placeholder: string;
  description?: string;
  type?: "text" | "password" | "number" | "email" | "tel" | "textarea";
  label?: React.ReactNode;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
  isRequired?: boolean;
  defaultValue?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any) => any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse?: (value: any) => any;
  postfix?: string;
}

function ReduxFormTextField(props: FormTextFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default ReduxFormTextField;

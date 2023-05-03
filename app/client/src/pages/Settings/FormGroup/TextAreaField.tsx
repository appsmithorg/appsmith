import React from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import type { Intent } from "constants/DefaultTheme";
import { FieldError } from "design-system-old";
import { Input } from "design-system";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
import { FormGroup } from "./Common";

const renderComponent = (
  componentProps: FormTextAreaFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  return (
    <>
      <Input
        {...componentProps}
        {...componentProps.input}
        errorMessage={
          !componentProps.hideErrorMessage &&
          showError &&
          componentProps.meta.error &&
          componentProps.meta.error
        }
        renderAs="textarea"
        size="md"
      />
      {!componentProps.hideErrorMessage && componentProps.meta.error && (
        <FieldError error={showError && componentProps.meta.error} />
      )}
    </>
  );
};

export type FormTextAreaFieldProps = {
  name?: string;
  placeholder?: string;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
  setting: Setting;
};

function FormTextAreaField(props: FormTextAreaFieldProps) {
  const { setting } = props;
  return (
    <FormGroup
      className={`t--admin-settings-text-area-input t--admin-settings-${
        setting.name || setting.id
      }`}
      setting={setting}
    >
      <Field
        component={renderComponent}
        name={setting.name || setting.id || ""}
        {...props}
        asyncControl
      />
    </FormGroup>
  );
}

export default FormTextAreaField;

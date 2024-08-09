import React from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import type { Intent } from "constants/DefaultTheme";
import { FieldError } from "@appsmith/ads-old";
import { Input } from "@appsmith/ads";
import type { Setting } from "ee/pages/AdminSettings/config/types";

const renderComponent = (
  componentProps: FormTextAreaFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  // TODO: Does there need to be a LazyCodeEditor here? Why?
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

export interface FormTextAreaFieldProps {
  name?: string;
  placeholder?: string;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
  setting: Setting;
}

function FormTextAreaField(props: FormTextAreaFieldProps) {
  const { setting } = props;
  return (
    <div
      className={`t--admin-settings-text-area-input t--admin-settings-${
        setting.name || setting.id
      }`}
    >
      <Field
        component={renderComponent}
        description={setting.subText || ""}
        isRequired={setting.isRequired}
        label={setting.label || ""}
        name={setting.name || setting.id || ""}
        {...props}
        asyncControl
      />
    </div>
  );
}

export default FormTextAreaField;

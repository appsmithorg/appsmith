import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import { TagInput } from "design-system-old";
import { FormGroup } from "./Common";
import type { Intent } from "constants/DefaultTheme";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const setting = componentProps.setting;
  return (
    <FormGroup
      className={`tag-input t--admin-settings-tag-input t--admin-settings-${
        setting.name || setting.id
      }`}
      setting={setting}
    >
      <TagInput {...componentProps} />
    </FormGroup>
  );
};

type TagListFieldProps = {
  name: string;
  placeholder: string;
  type: string;
  label?: string;
  intent: Intent;
  setting: Setting;
  customError?: (err: string) => void;
};

function TagInputField(props: TagListFieldProps) {
  return <Field component={renderComponent} {...props} />;
}

export default TagInputField;

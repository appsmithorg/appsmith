import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import TagInputComponent from "components/ads/TagInputComponent";
import { FormGroup } from "./Common";
import { Intent } from "constants/DefaultTheme";
import { Setting } from "@appsmith/pages/AdminSettings/config/types";

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const setting = componentProps.setting;
  return (
    <FormGroup
      className={`t--admin-settings-tag-input t--admin-settings-${setting.name ||
        setting.id}`}
      setting={setting}
    >
      <TagInputComponent {...componentProps} />
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

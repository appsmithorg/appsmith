import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import TagInputComponent from "components/ads/TagInputComponent";
import { Intent } from "constants/DefaultTheme";

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <TagInputComponent {...componentProps} />;
};

type TagListFieldProps = {
  name: string;
  placeholder: string;
  type: string;
  label: string;
  intent: Intent;
  customError: (err: string) => void;
};

function TagListField(props: TagListFieldProps) {
  return <Field component={renderComponent} {...props} />;
}

export default TagListField;

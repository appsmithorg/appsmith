import type { ReactElement } from "react";
import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import { TagInput } from "@appsmith/ads-old";
import type { Intent } from "constants/DefaultTheme";

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <TagInput {...componentProps} />;
};

interface TagListFieldProps {
  autofocus?: boolean;
  className?: string;
  name: string;
  placeholder: string;
  type: string;
  label: string;
  intent: Intent;
  customError: (err: string, values?: string[]) => void;
  suggestions?: { id: string; name: string; icon?: string }[];
  suggestionLeftIcon?: ReactElement;
}

function TagListField(props: TagListFieldProps) {
  return <Field component={renderComponent} {...props} />;
}

export default TagListField;

import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import TagInputComponent from "components/editorComponents/TagInputComponent";
import { Intent } from "constants/DefaultTheme";

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return (
    <React.Fragment>
      <TagInputComponent {...componentProps} />
    </React.Fragment>
  );
};

type TagListFieldProps = {
  name: string;
  placeholder: string;
  type: string;
  label: string;
  intent: Intent;
};

const TagListField = (props: TagListFieldProps) => {
  return (
    <React.Fragment>
      <Field component={renderComponent} {...props} />
    </React.Fragment>
  );
};

export default TagListField;

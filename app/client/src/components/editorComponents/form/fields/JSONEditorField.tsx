import React from "react";
import { Field } from "redux-form";
import DynamicAutocompleteInput, {
  DynamicAutocompleteInputProps,
} from "components/editorComponents/DynamicAutocompleteInput";

type Props = { name: string } & DynamicAutocompleteInputProps;

const JSONEditorField = (props: Props) => {
  return <Field name={props.name} component={DynamicAutocompleteInput} />;
};

export default JSONEditorField;

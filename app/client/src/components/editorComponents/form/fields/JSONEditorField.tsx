import React from "react";
import { Field } from "redux-form";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";

const JSONEditorField = (props: { name: string }) => {
  return <Field name={props.name} component={DynamicAutocompleteInput} />;
};

export default JSONEditorField;

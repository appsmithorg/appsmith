import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import DynamicAutocompleteInput, {
  DynamicAutocompleteInputProps,
} from "components/editorComponents/CodeEditor/DynamicAutocompleteInput";

class DynamicTextField extends React.Component<
  BaseFieldProps & DynamicAutocompleteInputProps
> {
  render() {
    return <Field component={DynamicAutocompleteInput} {...this.props} />;
  }
}

export default DynamicTextField;

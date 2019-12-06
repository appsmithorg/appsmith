import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import { TextInputProps } from "components/designSystems/appsmith/TextInputComponent";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";

class DynamicTextField extends React.Component<
  BaseFieldProps & TextInputProps
> {
  render() {
    return <Field component={DynamicAutocompleteInput} {...this.props} />;
  }
}

export default DynamicTextField;

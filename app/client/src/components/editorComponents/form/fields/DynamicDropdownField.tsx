import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import DropdownComponent from "components/editorComponents/DropdownComponent";
import { DropdownOption } from "components/constants";

interface DynamicDropdownFieldOptions {
  options: DropdownOption[];
  height?: string;
  width?: string;
  placeholder: string;
}

type DynamicDropdownFieldProps = BaseFieldProps & DynamicDropdownFieldOptions;
class DynamicDropdownField extends React.Component<DynamicDropdownFieldProps> {
  render() {
    return <Field component={DropdownComponent} {...this.props} />;
  }
}

export default DynamicDropdownField;

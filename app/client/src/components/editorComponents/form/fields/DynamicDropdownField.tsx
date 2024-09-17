import React from "react";
import type { BaseFieldProps } from "redux-form";
import { Field } from "redux-form";
import type { SelectProps } from "@appsmith/ads";
import { Select } from "@appsmith/ads";

type DynamicDropdownFieldProps = BaseFieldProps & SelectProps;
class DynamicDropdownField extends React.Component<DynamicDropdownFieldProps> {
  render() {
    return <Field component={Select} {...this.props} />;
  }
}

export default DynamicDropdownField;

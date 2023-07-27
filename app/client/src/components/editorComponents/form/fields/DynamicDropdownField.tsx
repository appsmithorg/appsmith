import React from "react";
import type { BaseFieldProps } from "redux-form";
import { Field } from "redux-form";
import type { SelectProps } from "design-system";
import { Select } from "design-system";

type DynamicDropdownFieldProps = BaseFieldProps & SelectProps;
class DynamicDropdownField extends React.Component<DynamicDropdownFieldProps> {
  render() {
    return <Field component={Select} {...this.props} />;
  }
}

export default DynamicDropdownField;

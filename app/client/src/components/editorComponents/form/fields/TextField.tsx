import React from "react";
import type { BaseFieldProps } from "redux-form";
import { Field } from "redux-form";
import type { InputProps } from "design-system";
import { Input } from "design-system";

interface FieldProps {
  type?: string;
}

class TextField extends React.Component<
  BaseFieldProps & InputProps & FieldProps
> {
  render() {
    return (
      <Field
        component={Input}
        type={this.props.type || "text"}
        {...this.props}
        isDisabled={this.props.isDisabled}
        noValidate
      />
    );
  }
}

export default TextField;

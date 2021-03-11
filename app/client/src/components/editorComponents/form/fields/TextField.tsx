import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import {
  BaseTextInput,
  TextInputProps,
} from "components/designSystems/appsmith/TextInputComponent";

type FieldProps = {
  type?: string;
};

class TextField extends React.Component<
  BaseFieldProps & TextInputProps & FieldProps
> {
  render() {
    return (
      <Field
        component={BaseTextInput}
        type={this.props.type || "text"}
        {...this.props}
        disabled={this.props.disabled}
        noValidate
      />
    );
  }
}

export default TextField;

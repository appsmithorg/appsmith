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
        type={this.props.type || "text"}
        component={BaseTextInput}
        {...this.props}
        noValidate
      />
    );
  }
}

export default TextField;

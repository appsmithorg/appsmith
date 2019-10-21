import React from "react";
import { Field } from "redux-form";
import { BaseTextInput, TextInputProps } from "../canvas/TextInputComponent";

interface TextFieldProps {
  name: string;
}

class TextField extends React.Component<TextFieldProps & TextInputProps> {
  render() {
    const { name } = this.props;
    return <Field name={name} component={BaseTextInput} {...this.props} />;
  }
}

export default TextField;

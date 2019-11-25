import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import {
  BaseTextInput,
  TextInputProps,
} from "components/designSystems/appsmith/TextInputComponent";

class TextField extends React.Component<BaseFieldProps & TextInputProps> {
  render() {
    return <Field component={BaseTextInput} {...this.props} />;
  }
}

export default TextField;

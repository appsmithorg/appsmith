import React from "react";
import type { BaseFieldProps } from "redux-form";
import { Field } from "redux-form";
import type { InputProps } from "@appsmith/ads";
import { Input } from "@appsmith/ads";

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
        // @ts-expect-error fix this the next time the file is edited
        isDisabled={this.props.isDisabled}
        noValidate
      />
    );
  }
}

export default TextField;

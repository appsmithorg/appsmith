import type { ControlType } from "constants/PropertyControlConstants";
import React from "react";
import { FieldArray } from "redux-form";
import type { ControlProps } from "../BaseControl";
import BaseControl from "../BaseControl";
import { FunctionCallingConfigForm } from "./components/FunctionCallingConfigForm";

/**
 * This component is used to configure the function calling for the AI assistant.
 * It allows the user to add, edit and delete functions that can be used by the AI assistant.
 */
export default class FunctionCallingConfigControl extends BaseControl<ControlProps> {
  render() {
    return (
      <FieldArray
        component={FunctionCallingConfigForm}
        key={this.props.configProperty}
        name={this.props.configProperty}
        props={{
          formName: this.props.formName,
          configProperty: this.props.configProperty,
        }}
        rerenderOnEveryChange={false}
      />
    );
  }

  getControlType(): ControlType {
    return "FUNCTION_CALLING_CONFIG_FORM";
  }
}

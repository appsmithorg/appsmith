import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { InputType } from "widgets/InputWidget";
import { ControlType } from "constants/PropertyControlConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import FormLabel from "components/editorComponents/FormLabel";

export function InputText(props: {
  label: string;
  value: string;
  isValid: boolean;
  validationMessage?: string;
  placeholder?: string;
  dataType?: string;
  isRequired?: boolean;
  name: string;
}) {
  const { name, placeholder, dataType, label, isRequired } = props;

  return (
    <div style={{ width: "50vh" }}>
      <FormLabel>
        {label} {isRequired && "*"}
      </FormLabel>
      <TextField
        name={name}
        placeholder={placeholder}
        type={dataType}
        showError
      />
    </div>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const {
      validationMessage,
      propertyValue,
      isValid,
      label,
      placeholderText,
      dataType,
      configProperty,
    } = this.props;

    return (
      <InputText
        name={configProperty}
        label={label}
        value={propertyValue}
        isValid={isValid}
        validationMessage={validationMessage}
        placeholder={placeholderText}
        dataType={this.getType(dataType)}
      />
    );
  }

  isNumberType(): boolean {
    const { inputType } = this.props;
    switch (inputType) {
      case "CURRENCY":
      case "INTEGER":
      case "NUMBER":
      case "PHONE_NUMBER":
        return true;
      default:
        return false;
    }
  }

  getType(dataType: InputType | undefined) {
    switch (dataType) {
      case "PASSWORD":
        return "password";
      case "NUMBER":
        return "number";
      default:
        return "text";
    }
  }

  getControlType(): ControlType {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
}

export default InputTextControl;

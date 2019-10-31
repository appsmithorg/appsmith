import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "../constants/PropertyControlConstants";
import { InputType } from "../widgets/InputWidget";
import { ControlWrapper, StyledInputGroup } from "./StyledControls";

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <StyledInputGroup
          type={this.isNumberType(this.props.inputType) ? "number" : "text"}
          onChange={this.onTextChange}
          placeholder={this.props.placeholderText}
          defaultValue={this.props.propertyValue}
        />
      </ControlWrapper>
    );
  }

  isNumberType(inputType: InputType): boolean {
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

  onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.updateProperty(this.props.propertyName, event.target.value);
  };

  getControlType(): ControlType {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType: InputType;
  isDisabled?: boolean;
}

export default InputTextControl;

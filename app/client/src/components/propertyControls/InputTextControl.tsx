import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledInputGroup } from "./StyledControls";
import { InputType } from "zlib";
import { ControlType } from "../../constants/PropertyControlConstants";

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

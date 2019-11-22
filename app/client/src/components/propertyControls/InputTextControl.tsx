import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledInputGroup } from "./StyledControls";
import { InputType } from "../../widgets/InputWidget";
import { ControlType } from "../../constants/PropertyControlConstants";
import { Intent } from "@blueprintjs/core";

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <StyledInputGroup
          intent={this.props.isValid ? Intent.NONE : Intent.DANGER}
          type={this.isNumberType() ? "number" : "text"}
          onChange={this.onTextChange}
          placeholder={this.props.placeholderText}
          defaultValue={this.props.propertyValue}
        />
      </ControlWrapper>
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

  onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value;
    this.updateProperty(this.props.propertyName, value);
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

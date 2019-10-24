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
          onChange={this.onTextChange}
          defaultValue={this.props.propertyValue}
        />
      </ControlWrapper>
    );
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

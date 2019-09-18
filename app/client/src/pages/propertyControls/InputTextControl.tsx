import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "../../constants/PropertyControlConstants";
import { InputGroup } from "@blueprintjs/core";

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    return <InputGroup onChange={this.onTextChange} />;
  }

  onTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.updateProperty(this.props.propertyName, event.target.value);
  }

  getControlType(): ControlType {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
}

export default InputTextControl;

import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledDynamicInput } from "./StyledControls";
import { InputType } from "widgets/InputWidget";
import { ControlType } from "constants/PropertyControlConstants";
import { Intent } from "@blueprintjs/core";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const { validationMessage, propertyValue, isValid, label } = this.props;
    return (
      <ControlWrapper>
        <label>{label}</label>
        <StyledDynamicInput>
          <DynamicAutocompleteInput
            intent={isValid ? Intent.NONE : Intent.DANGER}
            type={this.isNumberType() ? "number" : "text"}
            input={{
              value: propertyValue,
              onChange: this.onTextChange,
            }}
            placeholder={this.props.placeholderText}
            meta={{
              touched: true,
              error: validationMessage,
            }}
            showError
          />
        </StyledDynamicInput>
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

  onTextChange = (event: React.ChangeEvent<HTMLInputElement> | string) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }
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

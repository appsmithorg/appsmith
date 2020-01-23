import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledDynamicInput } from "./StyledControls";
import { InputType } from "widgets/InputWidget";
import { ControlType } from "constants/PropertyControlConstants";
// import { Intent } from "@blueprintjs/core";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";

export function InputText(props: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  isValid: boolean;
  validationMessage?: string;
}) {
  const { validationMessage, value, isValid, label, onChange } = props;
  return (
    <ControlWrapper>
      <label>{label}</label>
      <StyledDynamicInput>
        <DynamicAutocompleteInput
          input={{
            value: value,
            onChange: onChange,
          }}
          meta={{
            error: isValid ? "" : validationMessage,
            touched: true,
          }}
          theme={"DARK"}
        />
      </StyledDynamicInput>
    </ControlWrapper>
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  render() {
    const { validationMessage, propertyValue, isValid, label } = this.props;
    return (
      <InputText
        label={label}
        value={propertyValue}
        onChange={this.onTextChange}
        isValid={isValid}
        validationMessage={validationMessage}
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

  onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
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

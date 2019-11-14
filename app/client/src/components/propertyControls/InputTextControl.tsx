import React from "react";
import _ from "lodash";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledValidationError,
} from "./StyledControls";
import { InputType } from "../../widgets/InputWidget";
import { ControlType } from "../../constants/PropertyControlConstants";
import { isDynamicValue } from "../../utils/DynamicBindingUtils";
import { ERROR_CODES } from "../../constants/validationErrorCodes";

type InputTextControlType = InputType | "OBJECT" | "ARRAY" | "BOOLEAN";

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
        {this.props.propertyError && (
          <StyledValidationError>
            {this.props.propertyError}
          </StyledValidationError>
        )}
      </ControlWrapper>
    );
  }

  isNumberType(inputType: InputTextControlType): boolean {
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

  isStringType(inputType: InputTextControlType): boolean {
    switch (inputType) {
      case "TEXT":
      case "EMAIL":
      case "PASSWORD":
      case "SEARCH":
        return true;
      default:
        return false;
    }
  }

  onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { inputType } = this.props;
    let value: string | number = event.target.value;
    if (this.isNumberType(inputType)) {
      value = _.toNumber(value);
    }
    if (inputType === "ARRAY" || inputType === "OBJECT") {
      try {
        value = JSON.parse(value as string);
      } catch (e) {
        console.error(e);
        value = "";
      }
    }
    if (this.validateInput(value)) {
      this.updateProperty(this.props.propertyName, value);
    }
  };

  getControlType(): ControlType {
    return "INPUT_TEXT";
  }

  validateInput(inputValue: any): boolean {
    const {
      getDynamicValue,
      inputType,
      setPropertyValidation,
      propertyName,
    } = this.props;
    let value = inputValue;
    if (isDynamicValue(inputValue)) {
      value = getDynamicValue(inputValue);
    }
    if (this.isNumberType(inputType) && !_.isNumber(value)) {
      setPropertyValidation(propertyName, ERROR_CODES.TYPE_ERROR);
      return false;
    }
    if (this.isStringType(inputType) && !_.isString(value)) {
      setPropertyValidation(propertyName, ERROR_CODES.TYPE_ERROR);
      return false;
    }
    if (inputType === "ARRAY" && !Array.isArray(value)) {
      setPropertyValidation(propertyName, ERROR_CODES.TYPE_ERROR);
      return false;
    }
    if (inputType === "OBJECT" && !_.isObject(value)) {
      setPropertyValidation(propertyName, ERROR_CODES.TYPE_ERROR);
      return false;
    }
    setPropertyValidation(propertyName, ERROR_CODES.NO_ERROR);
    return true;
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType: InputTextControlType;
  isDisabled?: boolean;
}

export default InputTextControl;

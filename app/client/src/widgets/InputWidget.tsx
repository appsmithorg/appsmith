import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import InputComponent from "../components/blueprint/InputComponent";

class InputWidget extends BaseWidget<InputWidgetProps, WidgetState> {
  getPageView() {
    return (
      <InputComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        inputType={this.props.inputType}
        disabled={this.props.isDisabled}
        defaultValue={this.props.defaultText}
        maxNum={this.props.maxNum}
        minNum={this.props.minNum}
        placeholder={this.props.placeholderText}
        stepSize={1}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "INPUT_WIDGET";
  }
}

export type InputType =
  | "TEXT"
  | "NUMBER"
  | "INTEGER"
  | "PHONE_NUMBER"
  | "EMAIL"
  | "PASSWORD"
  | "CURRENCY"
  | "SEARCH";

export interface InputValidator {
  validationRegex: string;
  errorMessage: string;
}
export interface InputWidgetProps extends WidgetProps {
  inputType: InputType;
  defaultText?: string;
  isDisabled?: boolean;
  placeholderText?: string;
  maxChars?: number;
  minNum?: number;
  maxNum?: number;
  label: string;
  inputValidators: InputValidator[];
  focusIndex?: number;
  isAutoFocusEnabled?: boolean;
}

export default InputWidget;

import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import InputComponent from "components/designSystems/blueprint/InputComponent";
import { ActionPayload } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

class InputWidget extends BaseWidget<InputWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      inputType: VALIDATION_TYPES.TEXT,
      defaultText: VALIDATION_TYPES.TEXT,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      text: VALIDATION_TYPES.TEXT,
      regex: VALIDATION_TYPES.TEXT,
      errorMessage: VALIDATION_TYPES.TEXT,
      placeholderText: VALIDATION_TYPES.TEXT,
      maxChars: VALIDATION_TYPES.NUMBER,
      minNum: VALIDATION_TYPES.NUMBER,
      maxNum: VALIDATION_TYPES.NUMBER,
      label: VALIDATION_TYPES.TEXT,
      inputValidators: VALIDATION_TYPES.ARRAY,
      focusIndex: VALIDATION_TYPES.NUMBER,
      isAutoFocusEnabled: VALIDATION_TYPES.BOOLEAN,
    };
  }
  regex = new RegExp("");

  componentDidMount() {
    super.componentDidMount();
    if (this.props.regex) {
      try {
        this.regex = new RegExp(this.props.regex);
      } catch (e) {
        console.log("invalid regex");
      }
    }
  }

  componentDidUpdate(prevProps: InputWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (this.props.regex !== prevProps.regex && this.props.regex) {
      try {
        this.regex = new RegExp(this.props.regex);
      } catch (e) {
        console.log("invalid regex");
      }
    }
  }

  onValueChange = (value: string) => {
    this.updateWidgetProperty("text", value);
    super.executeAction(this.props.onTextChanged);
  };

  getPageView() {
    const errorMessage =
      this.props.regex &&
      this.props.text &&
      this.props.text.length > 0 &&
      !this.regex.test(this.props.text)
        ? this.props.errorMessage
        : undefined;
    return (
      <InputComponent
        onValueChange={this.onValueChange}
        widgetId={this.props.widgetId}
        errorMessage={errorMessage}
        inputType={this.props.inputType}
        disabled={this.props.isDisabled}
        maxChars={this.props.maxChars}
        label={this.props.label}
        defaultValue={this.props.defaultText}
        maxNum={this.props.maxNum}
        minNum={this.props.minNum}
        placeholder={this.props.placeholderText}
        isLoading={this.props.isLoading}
        isTextArea={
          this.props.bottomRow - this.props.topRow > 1 &&
          this.props.inputType === "TEXT"
        }
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
  text?: string;
  regex?: string;
  errorMessage?: string;
  placeholderText?: string;
  maxChars?: number;
  minNum?: number;
  maxNum?: number;
  onTextChanged?: ActionPayload[];
  label: string;
  inputValidators: InputValidator[];
  focusIndex?: number;
  isAutoFocusEnabled?: boolean;
}

export default InputWidget;

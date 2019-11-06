import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import InputComponent from "../components/designSystems/blueprint/InputComponent";
import { ActionPayload } from "../constants/ActionConstants";

class InputWidget extends BaseWidget<InputWidgetProps, WidgetState> {
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
    this.context.updateWidgetProperty(this.props.widgetId, "text", value);
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
        style={this.getPositionStyle()}
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
  onTextChanged: ActionPayload[];
  label: string;
  inputValidators: InputValidator[];
  focusIndex?: number;
  isAutoFocusEnabled?: boolean;
}

export default InputWidget;

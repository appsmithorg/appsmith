import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import InputComponent, {
  InputComponentProps,
} from "components/designSystems/blueprint/InputComponent";
import { EventType } from "constants/ActionConstants";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { FIELD_REQUIRED_ERROR } from "constants/messages";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";

class InputWidget extends BaseWidget<InputWidgetProps, InputWidgetState> {
  constructor(props: InputWidgetProps) {
    super(props);
    this.state = {
      text: "",
    };
  }
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      inputType: VALIDATION_TYPES.TEXT,
      defaultText: VALIDATION_TYPES.TEXT,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      text: VALIDATION_TYPES.TEXT,
      regex: VALIDATION_TYPES.REGEX,
      errorMessage: VALIDATION_TYPES.TEXT,
      placeholderText: VALIDATION_TYPES.TEXT,
      maxChars: VALIDATION_TYPES.NUMBER,
      minNum: VALIDATION_TYPES.NUMBER,
      maxNum: VALIDATION_TYPES.NUMBER,
      label: VALIDATION_TYPES.TEXT,
      inputValidators: VALIDATION_TYPES.ARRAY,
      focusIndex: VALIDATION_TYPES.NUMBER,
      isAutoFocusEnabled: VALIDATION_TYPES.BOOLEAN,
      onTextChanged: VALIDATION_TYPES.ACTION_SELECTOR,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      isValid: VALIDATION_TYPES.BOOLEAN,
    };
  }
  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onTextChanged: true,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{this.isRequired ? this.text && descriptionInput.text.length > 0 ? this.regex ? new RegExp(this.regex).test(this.text) : true : this.regex ? new RegExp(this.regex).test(this.text) : true}}`,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    const text = this.props.defaultText || "";
    this.setState({ text }, () => {
      this.updateWidgetMetaProperty("text", text);
    });
  }

  componentDidUpdate(prevProps: InputWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      (this.props.text !== prevProps.text && this.props.text === undefined) ||
      this.props.defaultText !== prevProps.defaultText
    ) {
      const text = this.props.defaultText || "";
      this.setState({ text }, () => {
        this.updateWidgetMetaProperty("text", text);
      });
    }
  }

  onValueChange = (value: string) => {
    this.setState({ text: value }, () => {
      this.updateWidgetMetaProperty("text", value);
    });
    if (!this.props.isDirty) {
      this.updateWidgetMetaProperty("isDirty", true);
    }
    if (this.props.onTextChanged) {
      super.executeAction({
        dynamicString: this.props.onTextChanged,
        event: {
          type: EventType.ON_TEXT_CHANGE,
        },
      });
    }
  };

  handleFocusChange = (focusState: boolean) => {
    this.updateWidgetMetaProperty("isFocused", focusState);
  };

  getPageView() {
    const value = this.state.text || "";
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const conditionalProps: Partial<InputComponentProps> = {};
    conditionalProps.errorMessage = this.props.errorMessage;
    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = FIELD_REQUIRED_ERROR;
    }
    if (this.props.maxChars) conditionalProps.maxChars = this.props.maxChars;
    if (this.props.maxNum) conditionalProps.maxNum = this.props.maxNum;
    if (this.props.minNum) conditionalProps.minNum = this.props.minNum;
    if (this.props.isRequired) conditionalProps.label = `${this.props.label} *`;
    return (
      <InputComponent
        value={value}
        isInvalid={isInvalid}
        onValueChange={this.onValueChange}
        widgetId={this.props.widgetId}
        inputType={this.props.inputType}
        disabled={this.props.isDisabled}
        label={this.props.label}
        defaultValue={this.props.defaultText}
        placeholder={this.props.placeholderText}
        isLoading={this.props.isLoading}
        multiline={
          this.props.bottomRow - this.props.topRow > 1 &&
          this.props.inputType === "TEXT"
        }
        stepSize={1}
        onFocusChange={this.handleFocusChange}
        showError={!!this.props.isFocused}
        {...conditionalProps}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "INPUT_WIDGET";
  }
}

export const InputTypes: { [key: string]: string } = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  PHONE_NUMBER: "PHONE_NUMBER",
  EMAIL: "EMAIL",
  PASSWORD: "PASSWORD",
  CURRENCY: "CURRENCY",
  SEARCH: "SEARCH",
};

export type InputType = typeof InputTypes[keyof typeof InputTypes];

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
  onTextChanged?: string;
  label: string;
  inputValidators: InputValidator[];
  isValid: boolean;
  focusIndex?: number;
  isAutoFocusEnabled?: boolean;
  isRequired?: boolean;
  isFocused?: boolean;
  isDirty?: boolean;
}

interface InputWidgetState extends WidgetState {
  text: string;
}

export default InputWidget;

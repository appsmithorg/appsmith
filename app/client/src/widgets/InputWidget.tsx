import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import InputComponent, {
  InputComponentProps,
} from "components/designSystems/blueprint/InputComponent";
import { EventType } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { FIELD_REQUIRED_ERROR } from "constants/messages";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";

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
      isRequired: VALIDATION_TYPES.BOOLEAN,
    };
  }
  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onTextChanged: true,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{
        function() {
          if(this.isRequired) {
            if(!this.text || this.text.length === 0) {
              return false
            }
          }
          if(this.regex) {
            return new RegExp(this.regex).test(this.text);
          }
          return true
        }()
      }}`,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.props.defaultText) {
      this.updateWidgetMetaProperty("text", this.props.defaultText);
    }
  }

  componentDidUpdate(prevProps: InputWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (this.props.defaultText) {
      if (
        (this.props.text !== prevProps.text && this.props.text === undefined) ||
        this.props.defaultText !== prevProps.defaultText
      ) {
        this.updateWidgetMetaProperty("text", this.props.defaultText);
      }
    }
  }

  onValueChange = (value: string) => {
    this.updateWidgetMetaProperty("text", value);
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
    const value = this.props.text || "";
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

export default InputWidget;

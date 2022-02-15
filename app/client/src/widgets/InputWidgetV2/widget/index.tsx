import React from "react";
import { WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import InputComponent, { InputComponentProps } from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
} from "@appsmith/constants/messages";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import BaseInputWidget from "widgets/BaseInputWidget";
import _, { isNil } from "lodash";
import derivedProperties from "./parsedDerivedProperties";
import { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import { mergeWidgetConfig } from "utils/helpers";
import { InputTypes } from "widgets/BaseInputWidget/constants";

export function defaultValueValidation(
  value: any,
  props: InputWidgetProps,
  _?: any,
): ValidationResponse {
  const STRING_ERROR_MESSAGE = "This value must be string";
  const NUMBER_ERROR_MESSAGE = "This value must be number";
  const EMPTY_ERROR_MESSAGE = "";
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [STRING_ERROR_MESSAGE],
    };
  }

  const { inputType } = props;
  let parsed;
  switch (inputType) {
    case "NUMBER":
      parsed = Number(value);
      let isValid, messages;

      if (_.isString(value) && value.trim() === "") {
        /*
         *  When value is emtpy string
         */
        isValid = true;
        messages = [EMPTY_ERROR_MESSAGE];
        parsed = undefined;
      } else if (!Number.isFinite(parsed)) {
        /*
         *  When parsed value is not a finite numer
         */
        isValid = false;
        messages = [NUMBER_ERROR_MESSAGE];
        parsed = undefined;
      } else {
        /*
         *  When parsed value is a Number
         */
        isValid = true;
        messages = [EMPTY_ERROR_MESSAGE];
      }

      return {
        isValid,
        parsed,
        messages,
      };
    case "TEXT":
    case "PASSWORD":
    case "EMAIL":
      parsed = value;
      if (!_.isString(parsed)) {
        try {
          parsed = _.toString(parsed);
        } catch (e) {
          return {
            isValid: false,
            parsed: "",
            messages: [STRING_ERROR_MESSAGE],
          };
        }
      }
      return {
        isValid: _.isString(parsed),
        parsed: parsed,
        messages: [EMPTY_ERROR_MESSAGE],
      };
    default:
      return {
        isValid: false,
        parsed: "",
        messages: [STRING_ERROR_MESSAGE],
      };
  }
}

export function minValueValidation(min: any, props: InputWidgetProps, _?: any) {
  const max = props.maxNum;
  const value = min;
  min = Number(min);

  if (_?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  } else if (!Number.isFinite(min)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    };
  } else if (max !== undefined && min >= max) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be lesser than max value"],
    };
  } else {
    return {
      isValid: true,
      parsed: Number(min),
      messages: [""],
    };
  }
}

export function maxValueValidation(max: any, props: InputWidgetProps, _?: any) {
  const min = props.minNum;
  const value = max;
  max = Number(max);

  if (_?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  } else if (!Number.isFinite(max)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be number"],
    };
  } else if (min !== undefined && max <= min) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than min value"],
    };
  } else {
    return {
      isValid: true,
      parsed: Number(max),
      messages: [""],
    };
  }
}
class InputWidget extends BaseInputWidget<InputWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "General",
          children: [
            {
              helpText: "Changes the type of data captured in the input",
              propertyName: "inputType",
              label: "Data Type",
              controlType: "DROP_DOWN",
              options: [
                {
                  label: "Text",
                  value: "TEXT",
                },
                {
                  label: "Number",
                  value: "NUMBER",
                },
                {
                  label: "Password",
                  value: "PASSWORD",
                },
                {
                  label: "Email",
                  value: "EMAIL",
                },
              ],
              isBindProperty: false,
              isTriggerProperty: false,
            },
            {
              helpText: "Sets maximum allowed text length",
              propertyName: "maxChars",
              label: "Max Chars",
              controlType: "INPUT_TEXT",
              placeholderText: "255",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.NUMBER,
                params: {
                  min: 1,
                },
              },
              hidden: (props: InputWidgetProps) => {
                return props.inputType !== InputTypes.TEXT;
              },
              dependencies: ["inputType"],
            },
            {
              helpText:
                "Sets the default text of the widget. The text is updated if the default text changes",
              propertyName: "defaultText",
              label: "Default Text",
              controlType: "INPUT_TEXT",
              placeholderText: "John Doe",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: defaultValueValidation,
                  expected: {
                    type: "string or number",
                    example: `John | 123`,
                    autocompleteDataType: AutocompleteDataType.STRING,
                  },
                },
              },
              dependencies: ["inputType"],
            },
            {
              helpText: "Sets the minimum allowed value",
              propertyName: "minNum",
              label: "Min",
              controlType: "INPUT_TEXT",
              placeholderText: "1",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: minValueValidation,
                  expected: {
                    type: "number",
                    example: `1`,
                    autocompleteDataType: AutocompleteDataType.NUMBER,
                  },
                },
              },
              hidden: (props: InputWidgetProps) => {
                return props.inputType !== InputTypes.NUMBER;
              },
              dependencies: ["inputType"],
            },
            {
              helpText: "Sets the maximum allowed value",
              propertyName: "maxNum",
              label: "Max",
              controlType: "INPUT_TEXT",
              placeholderText: "100",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: maxValueValidation,
                  expected: {
                    type: "number",
                    example: `100`,
                    autocompleteDataType: AutocompleteDataType.NUMBER,
                  },
                },
              },
              hidden: (props: InputWidgetProps) => {
                return props.inputType !== InputTypes.NUMBER;
              },
              dependencies: ["inputType"],
            },
          ],
        },
        {
          sectionName: "Icon Options",
          children: [
            {
              propertyName: "iconName",
              label: "Icon",
              helpText: "Sets the icon to be used in input field",
              controlType: "ICON_SELECT",
              isBindProperty: false,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.TEXT },
            },
            {
              propertyName: "iconAlign",
              label: "Icon alignment",
              helpText: "Sets the icon alignment of input field",
              controlType: "ICON_TABS",
              options: [
                {
                  icon: "VERTICAL_LEFT",
                  value: "left",
                },
                {
                  icon: "VERTICAL_RIGHT",
                  value: "right",
                },
              ],
              isBindProperty: false,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.TEXT },
              hidden: (props: InputWidgetProps) => !props.iconName,
              dependencies: ["iconName"],
            },
          ],
        },
      ],
      super.getPropertyPaneConfig(),
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return _.merge(super.getDerivedPropertiesMap(), {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
    });
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return super.getMetaPropertiesMap();
  }

  handleFocusChange = (focusState: boolean) => {
    super.handleFocusChange(focusState);
  };

  handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    super.handleKeyDown(e);
  };

  onValueChange = (value: string) => {
    let parsedValue;
    switch (this.props.inputType) {
      case "NUMBER":
        try {
          if (value === "") {
            parsedValue = null;
          } else if (value === "-") {
            parsedValue = "-";
          } else if (/\.$/.test(value)) {
            parsedValue = value;
          } else {
            parsedValue = Number(value);

            if (isNaN(parsedValue)) {
              parsedValue = undefined;
            }
          }
          break;
        } catch (e) {
          parsedValue = value;
        }
        break;
      case "TEXT":
      case "EMAIL":
      case "PASSWORD":
        parsedValue = value;
        break;
    }
    this.props.updateWidgetMetaProperty("text", parsedValue, {
      triggerPropertyName: "onTextChanged",
      dynamicString: this.props.onTextChanged,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
  };

  getPageView() {
    const value = this.props.text ?? "";
    let isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const conditionalProps: Partial<InputComponentProps> = {};
    conditionalProps.errorMessage = this.props.errorMessage;
    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }

    if (!isNil(this.props.maxNum)) {
      conditionalProps.maxNum = this.props.maxNum;
    }

    if (!isNil(this.props.minNum)) {
      conditionalProps.minNum = this.props.minNum;
    }

    if (this.props.inputType === "TEXT" && this.props.maxChars) {
      // pass maxChars only for Text type inputs, undefined for other types
      conditionalProps.maxChars = this.props.maxChars;
      if (
        this.props.defaultText &&
        this.props.defaultText.toString().length > this.props.maxChars
      ) {
        isInvalid = true;
        conditionalProps.errorMessage = createMessage(
          INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
        );
      }
    }
    const minInputSingleLineHeight =
      this.props.label || this.props.tooltip
        ? // adjust height for label | tooltip extra div
          GRID_DENSITY_MIGRATION_V1 + 4
        : // GRID_DENSITY_MIGRATION_V1 used to adjust code as per new scaled canvas.
          GRID_DENSITY_MIGRATION_V1;

    return (
      <InputComponent
        autoFocus={this.props.autoFocus}
        // show label and Input side by side if true
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
              1 && this.props.inputType === "TEXT"
          )
        }
        defaultValue={this.props.defaultText}
        disableNewLineOnPressEnterKey={!!this.props.onSubmit}
        disabled={this.props.isDisabled}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputType={this.props.inputType}
        isInvalid={isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        multiline={
          (this.props.bottomRow - this.props.topRow) /
            minInputSingleLineHeight >
            1 && this.props.inputType === "TEXT"
        }
        onFocusChange={this.handleFocusChange}
        onKeyDown={this.handleKeyDown}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        showError={!!this.props.isFocused}
        spellCheck={!!this.props.isSpellCheck}
        stepSize={1}
        tooltip={this.props.tooltip}
        value={value}
        widgetId={this.props.widgetId}
        {...conditionalProps}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "INPUT_WIDGET_V2";
  }
}

export interface InputWidgetProps extends BaseInputWidgetProps {
  defaultText?: string | number;
  maxChars?: number;
  isSpellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
}

export default InputWidget;

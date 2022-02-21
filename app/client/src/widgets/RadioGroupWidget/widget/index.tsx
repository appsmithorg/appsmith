import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import RadioGroupComponent from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { RadioOption } from "../constants";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { isArray, compact, isNumber } from "lodash";
/**
 * Validation rules:
 * 1. This property will take the value in the following format: Array<{ "label": "string", "value": "string" | number}>
 * 2. The `value` property should consists of unique values only.
 * 3. Data types of all the value props should be the same.
 */
function optionsCustomValidation(
  options: unknown,
  props: any,
  _: any,
): ValidationResponse {
  const validationUtil = (
    options: { label: string; value: string | number }[],
    _: any,
  ) => {
    let _isValid = true;
    let message = "";
    let valueType = "";
    const uniqueLabels: Record<string | number, string> = {};

    for (let i = 0; i < options.length; i++) {
      const { label, value } = options[i];
      if (!valueType) {
        valueType = typeof value;
      }
      //Checks the uniqueness all the values in the options
      if (!uniqueLabels.hasOwnProperty(value)) {
        uniqueLabels[value] = "";
      } else {
        _isValid = false;
        message = "path:value must be unique. Duplicate values found";
        break;
      }

      //Check if the required field "label" is present:
      if (!label) {
        _isValid = false;
        message =
          "Invalid entry at index: " + i + ". Missing required key: label";
        break;
      }

      //Validation checks for the the label.
      if (
        _.isNil(label) ||
        label === "" ||
        (typeof label !== "string" && typeof label !== "number")
      ) {
        _isValid = false;
        message =
          "Invalid entry at index: " +
          i +
          ". Value of key: label is invalid: This value does not evaluate to type string";
        break;
      }

      //Check if all the data types for the value prop is the same.
      if (typeof value !== valueType) {
        _isValid = false;
        message = "All value properties in options must have the same type";
        break;
      }

      //Check if the each object has value property.
      if (_.isNil(value)) {
        _isValid = false;
        message =
          'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>';
        break;
      }
    }

    return {
      isValid: _isValid,
      parsed: _isValid ? options : [],
      messages: [message],
    };
  };

  const invalidResponse = {
    isValid: false,
    parsed: [],
    messages: [
      'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
    ],
  };
  try {
    if (_.isString(options)) {
      options = JSON.parse(options as string);
    }

    if (Array.isArray(options)) {
      return validationUtil(options, _);
    } else {
      return invalidResponse;
    }
  } catch (e) {
    return invalidResponse;
  }
}
function defaultOptionValidation(
  value: unknown,
  props: any,
  _: any,
): ValidationResponse {
  //Checks if the value is not of object type in {{}}
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: ["This value does not evaluate to type: string or number"],
    };
  }

  //Checks if the value is not of boolean type in {{}}
  if (_.isBoolean(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: ["This value does not evaluate to type: string or number"],
    };
  }

  return {
    isValid: true,
    parsed: value,
  };
}

class RadioGroupWidget extends BaseWidget<RadioGroupWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Displays a list of unique options",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: optionsCustomValidation,
                expected: {
                  type:
                    'Array<{ "label": "string", "value": "string" | number}>',
                  example: `[{"label": "abc", "value": "abc" | 1}]`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Sets a default selected option",
            propertyName: "defaultOptionValue",
            label: "Default Selected Value",
            placeholderText: "Y",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            /**
             * Changing the validation to FUNCTION.
             * If the user enters Integer inside {{}} e.g. {{1}} then value should evalute to integer.
             * If user enters 1 e.g. then it should evaluate as string.
             */
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValidation,
                expected: {
                  type: `string |\nnumber (only works in mustache syntax)`,
                  example: `abc | {{1}}`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText:
              "Triggers an action when a user changes the selected option",
            propertyName: "onSelectionChange",
            label: "onSelectionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  static getDerivedPropertiesMap() {
    return {
      selectedOption:
        "{{_.find(this.options, { value: this.selectedOptionValue })}}",
      isValid: `{{ this.isRequired ? !!this.selectedOptionValue : true }}`,
      value: `{{this.selectedOptionValue}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValue: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptionValue: undefined,
    };
  }

  getPageView() {
    return (
      <RadioGroupComponent
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        key={this.props.widgetId}
        label={`${this.props.label}`}
        onRadioSelectionChange={this.onRadioSelectionChange}
        options={isArray(this.props.options) ? compact(this.props.options) : []}
        selectedOptionValue={this.props.selectedOptionValue}
        widgetId={this.props.widgetId}
      />
    );
  }

  onRadioSelectionChange = (updatedValue: string) => {
    let newVal;
    if (isNumber(this.props.options[0].value)) {
      newVal = parseFloat(updatedValue);
    } else {
      newVal = updatedValue;
    }
    this.props.updateWidgetMetaProperty("selectedOptionValue", newVal, {
      triggerPropertyName: "onSelectionChange",
      dynamicString: this.props.onSelectionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  static getWidgetType(): WidgetType {
    return "RADIO_GROUP_WIDGET";
  }
}

export interface RadioGroupWidgetProps extends WidgetProps {
  label: string;
  options: RadioOption[];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
}

export default RadioGroupWidget;

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

function optionsCustomValidation(
  value: unknown,
  props: any,
  _: any,
): ValidationResponse {
  const validationUtil = (
    value: { label: string; value: string | number }[],
  ) => {
    let _isValid = true;
    const _messages: string[] = [];
    let valueType = "";
    //Checks the uniqueness of the object elements in the array.
    const shouldBeUnique = value.map((entry) => entry.value);
    const uniqValues = Array.from(new Set(shouldBeUnique));
    if (uniqValues.length !== value.length) {
      _isValid = false;
      _messages.push("path:value must be unique. Duplicate values found");
    }

    for (let i = 0; i < value.length; i++) {
      if (!valueType) {
        valueType = typeof value[i].value;
      }
      //Check if the required field "label" is present:
      if (!("label" in value[i])) {
        _isValid = false;
        _messages.push(
          "Invalid entry at index: " + i + ". Missing required key: label",
        );
        break;
      }

      //Validation checks for the the label.
      if (
        value[i].label === undefined ||
        value[i].label === null ||
        value[i].label === "" ||
        (typeof value[i].label !== "string" &&
          typeof value[i].label !== "number")
      ) {
        _isValid = false;
        _messages.push(
          "Invalid entry at index: " +
            i +
            ". Value of key: label is invalid: This value does not evaluate to type string",
        );
        break;
      }

      //Check if all the data types for the value prop is the same.
      if (typeof value[i].value !== valueType) {
        _isValid = false;
        _messages.push(
          "All value properties in options must have the same type",
        );
        break;
      }

      //Check if the each object has value property.
      if (!("value" in value[i])) {
        _isValid = false;
        _messages.push(
          'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
        );
        break;
      }
    }

    return {
      isValid: _isValid,
      parsed: _isValid ? value : [],
      messages: _messages,
    };
  };

  const invalidResponse = {
    isValid: false,
    parsed: [],
    messages: [
      'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
    ],
  };
  if (value === undefined || value === null || value === "") {
    return {
      isValid: true,
      messages: [],
      parsed: value,
    };
  }
  if (_.isString(value)) {
    try {
      const _value = JSON.parse(value as string);
      if (Array.isArray(_value)) {
        const results = validationUtil(_value);
        return results;
      }
    } catch (e) {
      return invalidResponse;
    }
  }

  if (Array.isArray(value)) {
    try {
      const results = validationUtil(value);
      return results;
    } catch (e) {
      return invalidResponse;
    }
  }

  return {
    isValid: true,
    messages: [],
    parsed: value,
  };
}
function defaultOptionValidation(value: unknown): ValidationResponse {
  /**
   * This is a placeholder validation function for keeping the values as is,
   * And to display the expected structure and example.
   */
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
                  type: "string | number",
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

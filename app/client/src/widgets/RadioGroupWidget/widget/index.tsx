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
import { compact, isArray } from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function defaultOptionValueValidation(value: unknown): ValidationResponse {
  /**
   * Check if the data type of the value
   * If it's number send return as a number
   * Other than that returns as it is.
   */
  if (typeof value === "number") {
    return {
      isValid: true,
      parsed: value,
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
              type: ValidationTypes.ARRAY,
              unique: ["value"],
              params: {
                default: [],
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                    ],
                  },
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
                fn: defaultOptionValueValidation,
                expected: {
                  type: "string | number",
                  example: `1 | {{1}}`,
                  autocompleteDataType: AutocompleteDataType.ARRAY,
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
    if (typeof this.props.options[0].value === "number") {
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

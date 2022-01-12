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
import { compact, isArray, isNumber } from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function optionsCustomValidation(
  value: unknown,
  props: any,
  _: any,
): ValidationResponse {
  /**
   * This is a custom validation function for options property for this widget.
   * First it will perform ARRAY validations. If validation passes,
   * Then Validate that all the values present in the value property has same data type.
   */

  const validatePropertyDataTypes = (
    data: Record<string, unknown>[],
    property: string,
    _: any,
  ) => {
    /**
     * Function: To validate All object's property data types
     * e.g. This checks if all the value properties has same data type
     */
    const validationArr: string[] = [];
    data.map((value: Record<string, unknown>) => {
      if (!_.includes(validationArr, typeof value[property])) {
        validationArr.push(typeof value[property]);
      }
    });

    if (validationArr.length > 1) {
      return {
        isValid: false,
        messages: ["All values in options must have the same type"],
        parsed: "",
      };
    } else if (validationArr.length === 1) {
      return {
        isValid: true,
        messages: "",
        parsed: data,
      };
    }
  };

  //Predefined params for the validation of ARRAY of objects
  const customParams = {
    type: "ARRAY",
    params: {
      default: [],
      unique: ["value"],
      children: {
        type: "OBJECT",
        params: {
          required: true,
          allowedKeys: [
            {
              name: "label",
              type: "TEXT",
              params: {
                default: "",
                required: true,
              },
            },
            {
              name: "value",
              type: "TEXT",
              params: {
                default: "",
                required: true,
              },
            },
          ],
        },
      },
    },
  };
  let parsedResponse;
  const utils = require("workers/validations"); //Require statement helps to import import data when used under eval()
  parsedResponse = utils.VALIDATORS.ARRAY(customParams, value, props);
  if (parsedResponse.isValid) {
    parsedResponse = validatePropertyDataTypes(
      parsedResponse.parsed,
      "value",
      _,
    );
  }

  //Editing the validation message for invalid cases:
  parsedResponse.messages = parsedResponse.messages.map((message: string) => {
    if (message.includes("This value does not evaluate to type")) {
      if (message.includes('Array<{ "label": "string", "value": "string" }>')) {
        return message.replace(
          /Array<{ "label": "string", "value": "string" }>/g,
          'Array<{ "label": "string", "value": "string" | number}>',
        );
      } else {
        return message.replace(/string/g, "string or number");
      }
    }
    return message;
  });
  return parsedResponse;
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

import React from "react";
import { Alignment } from "@blueprintjs/core";
import { isArray, compact, isNumber } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { TextSize, WidgetType } from "constants/WidgetConstants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { RadioOption } from "../constants";
import { LabelPosition } from "components/constants";
import RadioGroupComponent from "../component";

/**
 * Validation rules:
 * 1. This property will take the value in the following format: Array<{ "label": "string", "value": "string" | number}>
 * 2. The `value` property should consists of unique values only.
 * 3. Data types of all the value props should be the same.
 */
export function optionsCustomValidation(
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
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
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
                  example: `[{"label": "One", "value": "one"}]`,
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
        ],
      },
      {
        sectionName: "Label",
        children: [
          {
            helpText: "Sets the label text of the widget",
            propertyName: "label",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label position of the widget",
            propertyName: "labelPosition",
            label: "Position",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              { label: "Auto", value: LabelPosition.Auto },
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label alignment of the widget",
            propertyName: "labelAlignment",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            options: [
              {
                icon: "LEFT_ALIGN",
                value: Alignment.LEFT,
              },
              {
                icon: "RIGHT_ALIGN",
                value: Alignment.RIGHT,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: (props: RadioGroupWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            helpText:
              "Sets the label width of the widget as the number of columns",
            propertyName: "labelWidth",
            label: "Width (in columns)",
            controlType: "NUMERIC_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            min: 0,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                natural: true,
              },
            },
            hidden: (props: RadioGroupWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
        ],
      },
      {
        sectionName: "Validations",
        children: [
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
        ],
      },
      {
        sectionName: "General",
        children: [
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
            propertyName: "isInline",
            helpText:
              "Whether the radio buttons are to be displayed inline horizontally",
            label: "Inline",
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

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font Color",
            helpText: "Control the color of the label associated",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Font Size",
            helpText: "Control the font size of the label associated",
            controlType: "DROP_DOWN",
            defaultValue: "0.875rem",
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelStyle",
            label: "Emphasis",
            helpText: "Control if the label should be bold or italics",
            controlType: "BUTTON_TABS",
            options: [
              {
                icon: "BOLD_FONT",
                value: "BOLD",
              },
              {
                icon: "ITALICS_FONT",
                value: "ITALIC",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "alignment",
            helpText: "Sets the alignment of the widget",
            label: "Alignment",
            controlType: "ICON_TABS",
            fullWidth: true,
            isBindProperty: true,
            isTriggerProperty: false,
            options: [
              {
                label: "Left",
                value: Alignment.LEFT,
              },
              {
                label: "Right",
                value: Alignment.RIGHT,
              },
            ],
          },
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the accent color of the widget",
            label: "Accent color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
      isDirty: false,
    };
  }

  componentDidUpdate(prevProps: RadioGroupWidgetProps): void {
    if (
      this.props.defaultOptionValue !== prevProps.defaultOptionValue &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  getPageView() {
    const {
      alignment,
      bottomRow,
      isDisabled,
      isInline,
      isLoading,
      label,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelTextColor,
      labelTextSize,
      options,
      selectedOptionValue,
      topRow,
      widgetId,
    } = this.props;

    const { componentHeight } = this.getComponentDimensions();

    return (
      <RadioGroupComponent
        accentColor={this.props.accentColor}
        alignment={alignment}
        compactMode={!((bottomRow - topRow) / GRID_DENSITY_MIGRATION_V1 > 1)}
        disabled={isDisabled}
        height={componentHeight}
        inline={Boolean(isInline)}
        key={widgetId}
        labelAlignment={labelAlignment}
        labelPosition={labelPosition}
        labelStyle={labelStyle}
        labelText={label}
        labelTextColor={labelTextColor}
        labelTextSize={labelTextSize}
        labelWidth={this.getLabelWidth()}
        loading={isLoading}
        onRadioSelectionChange={this.onRadioSelectionChange}
        options={isArray(options) ? compact(options) : []}
        required={this.props.isRequired}
        selectedOptionValue={selectedOptionValue}
        widgetId={widgetId}
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
    // Set isDirty to true when the selection changes
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
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
  options: RadioOption[];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
  isDisabled: boolean;
  isInline?: boolean;
  alignment: Alignment;
  label: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  isDirty: boolean;
  accentColor: string;
}

export default RadioGroupWidget;

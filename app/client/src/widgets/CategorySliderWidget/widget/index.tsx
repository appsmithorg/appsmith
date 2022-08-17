import * as React from "react";

import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { LabelPosition } from "components/constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { Alignment } from "@blueprintjs/core";
import SliderComponent, {
  SliderComponentProps,
} from "../../NumberSliderWidget/component/Slider";
import { SliderType, SliderOption } from "../../NumberSliderWidget/utils";

interface CategorySliderWidgetProps extends WidgetProps, SliderComponentProps {
  /** Color from theme.colors */
  accentColor?: string;
  /** Slider Type */
  sliderType: SliderType;
  /** Slider Options  */
  options?: SliderOption[];
  /**  Selected Value */
  value: string | undefined;
}

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

class CategorySliderWidget extends BaseWidget<
  CategorySliderWidgetProps,
  WidgetState
> {
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
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
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
            controlType: "SWITCH",
            helpText: "Disables clicks to this widget",
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
          {
            propertyName: "labelAlwaysOn",
            helpText: "Keep showing the label with value",
            label: "Label Always On",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "showLabelOnHover",
            helpText: "Show widget value label on Hover",
            label: "Show Label On Hover",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Label",
        children: [
          {
            helpText: "Sets the label text of the widget",
            propertyName: "labelText",
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
            controlType: "DROP_DOWN",
            options: [
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
              { label: "Auto", value: LabelPosition.Auto },
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
            hidden: (props: CategorySliderWidgetProps) =>
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
            hidden: (props: CategorySliderWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            propertyName: "labelTextColor",
            label: "Label Text Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Label Text Size",
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
            label: "Label Font Style",
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
        sectionName: "Styles",
        children: [
          {
            propertyName: "accentColor",
            label: "Fill Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "sliderSize",
            label: "Slider Size",
            controlType: "DROP_DOWN",
            defaultValue: "md",
            options: [
              {
                label: "sm",
                value: "sm",
                subText: "6px",
              },
              {
                label: "md",
                value: "md",
                subText: "8px",
              },
              {
                label: "lg",
                value: "lg",
                subText: "10px",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, any> {
    return {
      value: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
    };
  }

  getSliderOptions = () => {
    const options = this.props.options || [];
    /** get the stepSize - if we have 4 options stepSize is 25  */
    const stepSize = Math.round(100 / options.length);

    /**
     * For the marks we need Array<{ value: number, label: string }>
     * So we have sliderOptions matching its type.
     */
    const sliderOptions = options.map((option, index) => ({
      /**
       * create categories - if we have 4 options
       * value will be 25, 50, 75, 100
       */
      value: (index + 1) * stepSize,
      label: option.label,
      optionValue: option.value,
    }));

    return {
      /**
       * If a user has messed up the option labels or values
       * this.props.options is empty array so disable the slider
       */
      disabled: this.props.isDisabled || sliderOptions.length === 0,
      sliderOptions,
      stepSize,
    };
  };

  onChangeEnd = (sliderValue: number) => {
    const { disabled, sliderOptions } = this.getSliderOptions();
    if (!disabled) {
      const selectedValue = sliderOptions.find(
        (option) => option.value === sliderValue,
      )?.optionValue;

      this.props.updateWidgetMetaProperty("value", selectedValue);
    }
  };

  getPageView() {
    const { disabled, sliderOptions, stepSize } = this.getSliderOptions();

    const sliderValue = sliderOptions.find(
      (option) => option.optionValue === this.props.value,
    )?.value;

    return (
      <SliderComponent
        color={this.props.accentColor || TAILWIND_COLORS.green["600"]}
        disabled={disabled}
        labelAlignment={this.props.labelAlignment}
        labelAlwaysOn={this.props.labelAlwaysOn}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        loading={this.props.isLoading}
        marks={sliderOptions}
        max={stepSize * sliderOptions.length}
        min={stepSize}
        name={this.props.widgetName}
        onChangeEnd={this.onChangeEnd}
        showLabelOnHover={this.props.showLabelOnHover}
        sliderSize={this.props.sliderSize || "md"}
        sliderTooltip={(val: number) =>
          sliderOptions.find((option) => option.value === val)?.label || ""
        }
        sliderType={SliderType.CATEGORICAL}
        sliderValue={sliderValue || 0}
        step={stepSize}
      />
    );
  }

  static getWidgetType() {
    return "CATEGORY_SLIDER_WIDGET";
  }
}

export default CategorySliderWidget;

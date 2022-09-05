import * as React from "react";

import { Alignment } from "@blueprintjs/core";
import { ValidationTypes } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { LabelPosition } from "components/constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  defaultOptionValidation,
  optionsCustomValidation,
} from "../validations";
import SliderComponent, {
  SliderComponentProps,
} from "../../NumberSliderWidget/component/Slider";

export type SliderOption = {
  label: string;
  value: string;
};

export interface CategorySliderWidgetProps
  extends WidgetProps,
    SliderComponentProps {
  /** Color from theme.colors */
  accentColor?: string;

  /** Slider Options  */
  options?: SliderOption[];

  /** defaultOption value */
  defaultOptionValue?: string;

  /** isDirty meta property */
  isDirty: boolean;

  /**  Selected Value */
  value: string | undefined;

  /** onChange action selector */
  onChange: string;
}

class CategorySliderWidget extends BaseWidget<
  CategorySliderWidgetProps,
  WidgetState
> {
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
            label: "Default Value",
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
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "showMarksLabel",
            helpText: "Controls the visibility of the marks Label widget",
            label: "Show Marks",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
            propertyName: "tooltipAlwaysOn",
            helpText: "Keep showing the tooltip with value",
            label: "Tooltip Always On",
            controlType: "SWITCH",
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
            helpText: "Triggers an action when a user changes the slider value",
            propertyName: "onChange",
            label: "onChange",
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
        sectionName: "General",
        children: [
          {
            helpText: "Controls the size of the slider",
            propertyName: "sliderSize",
            label: "Size",
            controlType: "DROP_DOWN",
            defaultValue: "m",
            options: [
              {
                label: "S",
                value: "s",
                subText: "4px",
              },
              {
                label: "M",
                value: "m",
                subText: "6px",
              },
              {
                label: "L",
                value: "l",
                subText: "8px",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Font Size",
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
        sectionName: "Color",
        children: [
          {
            helpText: "Sets the fill color of the widget",
            propertyName: "accentColor",
            label: "Fill Color",
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
            label: "Default Value",
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
            propertyName: "showMarksLabel",
            helpText: "Controls the visibility of the marks Label widget",
            label: "Show Marks",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
            propertyName: "tooltipAlwaysOn",
            helpText: "Keep showing the tooltip with value",
            label: "Tooltip Always On",
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
        ],
      },
      {
        sectionName: "Label Style",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Size",
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
            label: "Font Style",
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
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when a user changes the slider value",
            propertyName: "onChange",
            label: "onChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
      {
        sectionName: "Style",
        children: [
          {
            helpText: "Controls the size of the slider",
            propertyName: "sliderSize",
            label: "Size",
            controlType: "DROP_DOWN",
            defaultValue: "m",
            options: [
              {
                label: "S",
                value: "s",
                subText: "4px",
              },
              {
                label: "M",
                value: "m",
                subText: "6px",
              },
              {
                label: "L",
                value: "l",
                subText: "8px",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the fill color of the widget",
            propertyName: "accentColor",
            label: "Fill Color",
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

  componentDidUpdate(prevProps: CategorySliderWidgetProps) {
    /**
     * If you change the defaultOptionValue from the propertyPane
     * or say an input widget you are basically resetting the widget
     * therefore we reset the isDirty.
     */
    if (
      this.props.defaultOptionValue !== prevProps.defaultOptionValue &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getDefaultPropertiesMap(): Record<string, any> {
    return {
      value: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
      isDirty: false,
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
      sliderOptions,
      stepSize,
    };
  };

  onChangeEnd = (sliderValue: number) => {
    const { sliderOptions } = this.getSliderOptions();

    const selectedValue = sliderOptions.find(
      (option) => option.value === sliderValue,
    )?.optionValue;

    this.props.updateWidgetMetaProperty("value", selectedValue, {
      triggerPropertyName: "onChange",
      dynamicString: this.props.onChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });

    // Set isDirty to true when we change slider value
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
  };

  getPageView() {
    const { sliderOptions, stepSize } = this.getSliderOptions();

    const sliderValue = sliderOptions.find(
      (option) => option.optionValue === this.props.value,
    )?.value;

    return (
      <SliderComponent
        color={this.props.accentColor || TAILWIND_COLORS.green["600"]}
        disabled={this.props.isDisabled || sliderOptions.length === 0}
        labelAlignment={this.props.labelAlignment}
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
        showMarksLabel={this.props.showMarksLabel || sliderOptions.length === 0}
        sliderSize={this.props.sliderSize || "m"}
        sliderTooltip={(val: number) =>
          sliderOptions.find((option) => option.value === val)?.label || ""
        }
        sliderValue={sliderValue || stepSize}
        step={stepSize}
        tooltipAlwaysOn={this.props.tooltipAlwaysOn || false}
      />
    );
  }

  static getWidgetType() {
    return "CATEGORY_SLIDER_WIDGET";
  }
}

export default CategorySliderWidget;

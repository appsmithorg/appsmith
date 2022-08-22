import * as React from "react";

import { ValidationTypes } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import RangeSliderComponent, {
  RangeSliderComponentProps,
} from "../component/RangeSlider";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

interface RangeSliderWidgetProps
  extends WidgetProps,
    RangeSliderComponentProps {
  /** Color from theme.colors */
  accentColor?: string;
  /** defaultStart Value */
  defaultStartValue?: number;
  /** defaultEnd Value */
  defaultEndValue?: number;
  /** start value metaProperty */
  start: number;
  /** end value metaProperty  */
  end: number;
  /** isDirty meta property */
  isDirty: boolean;
  /**
   * onStartChange action selector triggers when
   * the first thumb of slider is changed
   */
  onStartChange: string;
  /**
   * onEndChange action selector triggers when
   * the second thumb of slider is changed
   */
  onEndChange: string;
}

class RangeSliderWidget extends BaseWidget<
  RangeSliderWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "defaultStartValue",
            helpText: "Sets the start value of the widget",
            label: "Start Value",
            controlType: "INPUT_TEXT",
            placeholderText: "Start Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "defaultEndValue",
            helpText: "Sets the end value of the widget",
            label: "End Value",
            controlType: "INPUT_TEXT",
            placeholderText: "End Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "max",
            helpText: "Sets the max value of the widget",
            label: "Max Value",
            controlType: "INPUT_TEXT",
            placeholderText: "100",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "min",
            helpText: "Sets the min value of the widget",
            label: "Min Value",
            controlType: "INPUT_TEXT",
            placeholderText: "0",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "step",
            helpText: "Sets the step size of the widget",
            label: "Step Size",
            controlType: "INPUT_TEXT",
            placeholderText: "10",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "minRange",
            helpText: "Sets the min range of the widget",
            label: "Min Range",
            controlType: "INPUT_TEXT",
            placeholderText: "10",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
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
          {
            helpText: "Display Value Marks",
            propertyName: "marks",
            label: "Marks",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "value": "20", "label": "20%" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                unique: ["value"],
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "value",
                        type: ValidationTypes.NUMBER,
                        params: {
                          default: "",
                          requiredKey: true,
                        },
                      },
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          requiredKey: true,
                        },
                      },
                    ],
                  },
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
            hidden: (props: RangeSliderWidgetProps) =>
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
            hidden: (props: RangeSliderWidgetProps) =>
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
            helpText: "Sets the fill color of the widget",
            propertyName: "accentColor",
            label: "Fill Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls the size of the slider",
            propertyName: "sliderSize",
            label: "Slider Size",
            controlType: "DROP_DOWN",
            defaultValue: "m",
            options: [
              {
                label: "S",
                value: "s",
                subText: "6px",
              },
              {
                label: "M",
                value: "m",
                subText: "8px",
              },
              {
                label: "L",
                value: "l",
                subText: "10px",
              },
            ],
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
            propertyName: "onStartValueChange",
            label: "onStartChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when a user changes the slider value",
            propertyName: "onEndValueChange",
            label: "onEndChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  componentDidUpdate(prevProps: RangeSliderWidgetProps) {
    /**
     * If you change the defaultValues from the propertyPane
     * or say an input widget you are basically resetting the widget
     * therefore we reset the isDirty.
     */
    if (
      (this.props.defaultStartValue !== prevProps.defaultStartValue ||
        this.props.defaultEndValue !== prevProps.defaultEndValue) &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getDefaultPropertiesMap(): Record<string, any> {
    return {
      start: "defaultStartValue",
      end: "defaultEndValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      start: 0,
      end: 20,
      isDirty: false,
    };
  }

  onChangeEnd = ([start, end]: [number, number]) => {
    if (this.props.start !== start) {
      this.props.updateWidgetMetaProperty("start", start, {
        triggerPropertyName: "onStartChange",
        dynamicString: this.props.onStartValueChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }

    if (this.props.end !== end) {
      this.props.updateWidgetMetaProperty("end", end, {
        triggerPropertyName: "onEndChange",
        dynamicString: this.props.onEndValueChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }

    // Set isDirty to true when we change slider value
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
  };

  getPageView() {
    return (
      <RangeSliderComponent
        color={this.props.accentColor || TAILWIND_COLORS.green["600"]}
        disabled={this.props.isDisabled || false}
        endValue={this.props.end || 20}
        labelAlignment={this.props.labelAlignment}
        labelAlwaysOn={this.props.labelAlwaysOn}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        loading={this.props.isLoading}
        marks={this.props.marks}
        max={this.props.max || 100}
        min={this.props.min || 0}
        minRange={this.props.minRange || 10}
        name={this.props.widgetName}
        onChangeEnd={this.onChangeEnd}
        showLabelOnHover={this.props.showLabelOnHover}
        sliderSize={this.props.sliderSize || "m"}
        startValue={this.props.start || 0}
        step={this.props.step || 1}
      />
    );
  }

  static getWidgetType() {
    return "RANGE_SLIDER_WIDGET";
  }
}

export default RangeSliderWidget;

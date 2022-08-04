import * as React from "react";

import { ValidationTypes } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import SingleSliderComponent, {
  SingleSliderComponentProps,
} from "../component/SingleSlider";

interface SingleSliderWidgetProps
  extends WidgetProps,
    SingleSliderComponentProps {}

class SingleSliderWidget extends BaseWidget<
  SingleSliderWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "defaultValue",
            helpText: "Sets the value of the widget",
            label: "Value",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
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
            isJSConvertible: true,
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
            isJSConvertible: true,
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
            isJSConvertible: true,
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
        sectionName: "Styles",
        children: [
          {
            propertyName: "fillColor",
            label: "Fill Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^((?![<|{{]).+){0,1}/,
                expected: {
                  type: "string (HTML color name or HEX value)",
                  example: `red | #9C0D38`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
        ],
      },
      {
        propertyName: "sliderSize",
        label: "Slider Size",
        controlType: "DROP_DOWN",
        defaultValue: "md",
        options: [
          {
            label: "xs",
            value: "xs",
            subText: "4px",
          },
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
          {
            label: "xl",
            value: "xl",
            subText: "12px",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, any> {
    return {
      value: "defaultValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: 0,
    };
  }

  onChangeEnd = (value: number) => {
    this.props.updateWidgetMetaProperty("value", value);
  };

  getPageView() {
    return (
      <div className="flex items-center">
        <SingleSliderComponent
          color={this.props.fillColor}
          labelAlwaysOn={this.props.labelAlwaysOn}
          marks={this.props.marks || []}
          max={this.props.max || 100}
          min={this.props.min || 0}
          name={this.props.widgetName}
          onChangeEnd={this.onChangeEnd}
          showLabelOnHover={this.props.showLabelOnHover}
          sliderSize={this.props.sliderSize || "md"}
          sliderValue={this.props.value || 0}
          step={this.props.step || 1}
        />
      </div>
    );
  }

  static getWidgetType() {
    return "SINGLE_SLIDER_WIDGET";
  }
}

export default SingleSliderWidget;

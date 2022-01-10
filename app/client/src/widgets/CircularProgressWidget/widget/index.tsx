import * as React from "react";
import pick from "lodash/pick";

import WidgetStyleContainer from "components/designSystems/appsmith/WidgetStyleContainer";
import { ValidationTypes } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import CircularProgressComponent, {
  CircularProgressComponentProps,
  StrokeLineCapTypes,
} from "../component";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

interface CircularProgressWidgetProps
  extends WidgetProps,
    CircularProgressComponentProps {}

class CircularProgressWidget extends BaseWidget<
  CircularProgressWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "value",
            helpText: "Sets the value of the widget",
            label: "Value",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "maxValue",
            helpText: "If value is 0.60 or 600 set maxValue as 1 or 1000.",
            label: "Max Value",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "successValue",
            helpText: "Sets the success value of the widget",
            label: "Success Value",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "strokeWidth",
            helpText: "Sets the width of the stroke",
            label: "Stroke Width",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "strokeLineCap",
            label: "Stroke Line Cap",
            controlType: "DROP_DOWN",
            helpText: "Select Stroke Line Cap",
            options: [
              {
                label: "round",
                value: StrokeLineCapTypes.round,
              },
              {
                label: "butt",
                value: StrokeLineCapTypes.butt,
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  StrokeLineCapTypes.round,
                  StrokeLineCapTypes.butt,
                ],
                default: StrokeLineCapTypes.round,
              },
            },
          },
          {
            propertyName: "counterClockwise",
            helpText: "Counter clock wise",
            label: "CounterClockWise",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "backgroundColor",
            label: "Background Color",
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
          {
            propertyName: "textColor",
            label: "Text Color",
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
          {
            propertyName: "successTextColor",
            label: "Success Text Color",
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
          {
            propertyName: "successColor",
            label: "Success Color",
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
          {
            propertyName: "pathColor",
            label: "Path Color",
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
          {
            propertyName: "trailColor",
            label: "Trail Color",
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
          {
            propertyName: "backgroundPadding",
            helpText: "Sets the padding of the stroke",
            label: "Background Padding",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "textSize",
            helpText: "Sets the text Size",
            label: "Text Size",
            controlType: "INPUT_TEXT",
            placeholderText: "Value:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
        ],
      },
    ];
  }

  getPageView() {
    return (
      <WidgetStyleContainer
        {...pick(this.props, [
          "widgetId",
          "containerStyle",
          "borderColor",
          "borderWidth",
        ])}
      >
        <CircularProgressComponent
          backgroundColor={this.props.backgroundColor}
          backgroundPadding={this.props.backgroundPadding}
          counterClockwise={this.props.counterClockwise}
          maxValue={this.props.maxValue}
          pathColor={this.props.pathColor}
          strokeLineCap={this.props.strokeLineCap}
          strokeWidth={this.props.strokeWidth}
          successColor={this.props.successColor}
          successTextColor={this.props.successTextColor}
          successValue={this.props.successValue}
          textColor={this.props.textColor}
          textSize={this.props.textSize}
          trailColor={this.props.trailColor}
          value={this.props.value}
        />
      </WidgetStyleContainer>
    );
  }

  static getWidgetType() {
    return "CIRCULAR_PROGRESS_WIDGET";
  }
}

export default CircularProgressWidget;

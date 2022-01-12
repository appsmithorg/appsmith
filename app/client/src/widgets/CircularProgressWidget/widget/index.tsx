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
            propertyName: "progress",
            helpText: "Sets the progress value of the widget",
            label: "Progress",
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
          {
            propertyName: "showResult",
            helpText: "Controls the visibility of progress value",
            label: "Show result",
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
          counterClockwise={this.props.counterClockwise}
          fillColor={this.props.fillColor}
          progress={this.props.progress}
          showResult={this.props.showResult}
          strokeLineCap={this.props.strokeLineCap}
        />
      </WidgetStyleContainer>
    );
  }

  static getWidgetType() {
    return "CIRCULAR_PROGRESS_WIDGET";
  }
}

export default CircularProgressWidget;

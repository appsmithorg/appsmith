import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import ProgressBarComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";
import { Colors } from "constants/Colors";
import { BarType } from "../constants";

class ProgressBarWidget extends BaseWidget<
  ProgressBarWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Sets progress bar type",
            propertyName: "barType",
            label: "Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Indeterminate",
                value: BarType.INDETERMINATE,
              },
              {
                label: "Determinate",
                value: BarType.DETERMINATE,
              },
            ],
            defaultValue: BarType.INDETERMINATE,
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText: "Provide progress value",
            propertyName: "progress",
            label: "Progress",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter progress value",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
            defaultValue: 50,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 0, max: 100, default: 50 },
            },
          },
          {
            helpText: "Sets a number of steps",
            propertyName: "steps",
            label: "Number of steps",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter number of steps",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 1, max: 100, default: 1, natural: true },
            },
            hidden: (props: ProgressBarWidgetProps) => {
              return props.barType !== BarType.DETERMINATE;
            },
            dependencies: ["barType"],
          },
          {
            helpText: "Controls the visibility of progress value",
            propertyName: "showResult",
            label: "Show result",
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
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            helpText: "Controls the progress color of progress bar",
            propertyName: "fillColor",
            label: "Fill Color",
            controlType: "COLOR_PICKER",
            defaultColor: Colors.GREEN,
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  getPageView() {
    return (
      <ProgressBarComponent
        barType={this.props.barType}
        fillColor={this.props.fillColor}
        progress={this.props.progress}
        showResult={this.props.showResult}
        steps={this.props.steps}
      />
    );
  }

  static getWidgetType(): string {
    return "PROGRESSBAR_WIDGET";
  }
}

export interface ProgressBarWidgetProps extends WidgetProps {
  progress?: number;
  showResult: boolean;
  fillColor: string;
  barType: BarType;
  steps: number;
}

export default ProgressBarWidget;

import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import DividerComponent from "components/designSystems/blueprint/DividerComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";

class DividerWidget extends BaseWidget<DividerWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Controls widget orientation",
            propertyName: "isHorizontal",
            label: "Horizontal",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            helpText: "Controls divider stroke style",
            propertyName: "strokeStyle",
            label: "Stroke Style",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Solid",
                value: "solid",
              },
              {
                label: "Dashed",
                value: "dashed",
              },
              {
                label: "Dotted",
                value: "dotted",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            helpText: "Controls stroke color of divider",
            propertyName: "dividerColor",
            label: "Divider Colour",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText: "Controls thickness of divider",
            propertyName: "thickness",
            label: "Thickness (px)",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter thickness in pixels",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.NUMBER,
          },
        ],
      },
    ];
  }

  getPageView() {
    return (
      <DividerComponent
        dividerColor={this.props.dividerColor}
        isHorizontal={this.props.isHorizontal}
        strokeStyle={this.props.strokeStyle}
        thickness={this.props.thickness}
        widgetId={this.props.widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "DIVIDER_WIDGET";
  }
}

export interface DividerWidgetProps extends WidgetProps {
  isHorizontal: boolean;
  strokeStyle?: "solid" | "dashed" | "dotted";
  dividerColor?: string;
  thickness?: number;
}

export default DividerWidget;
export const ProfiledDividerWidget = Sentry.withProfiler(DividerWidget);

import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import DividerComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";

class DividerWidget extends BaseWidget<DividerWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Controls widget orientation",
            propertyName: "orientation",
            label: "Orientation",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Horizontal",
                value: "horizontal",
              },
              {
                label: "Vertical",
                value: "vertical",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
        sectionName: "Styles",
        children: [
          {
            helpText: "Controls the style of the divider",
            propertyName: "strokeStyle",
            label: "Dash Style",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Solid",
                value: "solid",
                icon: "cap-solid",
                iconSize: "large",
              },
              {
                label: "Dashed",
                value: "dashed",
                icon: "line-dashed",
                iconSize: "large",
              },
              {
                label: "Dotted",
                value: "dotted",
                icon: "line-dotted",
                iconSize: "large",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls the thickness of divider",
            propertyName: "thickness",
            label: "Thickness (px)",
            controlType: "INPUT_TEXT",
            placeholderText: "5",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 0, default: 0 },
            },
          },
          {
            helpText: "Controls the stroke color of divider",
            propertyName: "dividerColor",
            label: "Divider Color",
            controlType: "COLOR_PICKER",
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
          {
            helpText: "Controls the type of divider cap",
            propertyName: "capType",
            label: "Cap",
            controlType: "DROP_DOWN",
            isJSConvertible: true,
            options: [
              {
                label: "No Cap",
                value: "nc",
                icon: "cap-solid",
                iconSize: "large",
              },
              {
                label: "Arrow",
                value: "arrow",
                icon: "arrow-forward",
                iconSize: "large",
              },
              {
                label: "Dot",
                value: "dot",
                icon: "cap-dot",
                iconSize: "large",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["nc", "arrow", "dot"],
                required: true,
                default: "nc",
              },
            },
          },
          {
            helpText:
              "Changes the position of the cap if a valid cap is selected.",
            propertyName: "capSide",
            label: "Cap Position",
            controlType: "ICON_TABS",
            options: [
              {
                icon: "DIVIDER_CAP_LEFT",
                value: -1,
              },
              {
                icon: "DIVIDER_CAP_ALL",
                value: 0,
                width: 48,
              },
              {
                icon: "DIVIDER_CAP_RIGHT",
                value: 1,
              },
            ],
            defaultValue: "0",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  getPageView() {
    return (
      <DividerComponent
        capSide={this.props.capSide}
        capType={this.props.capType}
        dividerColor={this.props.dividerColor}
        orientation={this.props.orientation}
        strokeStyle={this.props.strokeStyle}
        thickness={this.props.thickness}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "DIVIDER_WIDGET";
  }
}

export interface DividerWidgetProps extends WidgetProps {
  orientation: string;
  capType: string;
  capSide?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  dividerColor?: string;
  thickness?: number;
}

export default DividerWidget;

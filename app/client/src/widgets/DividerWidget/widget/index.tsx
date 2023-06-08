import type { WidgetType } from "constants/WidgetConstants";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import DividerComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "widgets/constants";
import { isAutoLayout } from "utils/autoLayout/flexWidgetUtils";
import type { SetterConfig } from "entities/AppTheming";

class DividerWidget extends BaseWidget<DividerWidgetProps, WidgetState> {
  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc": "Divider is a simple UI widget used as a separator",
      "!url": "https://docs.appsmith.com/widget-reference/divider",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      orientation: "string",
      capType: "string",
      capSide: "number",
      strokeStyle: "string",
      dividerColor: "string",
      thickness: "number",
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
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
            propertyName: "animateLoading",
            label: "Animate loading",
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
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Controls widget orientation",
            propertyName: "orientation",
            label: "Direction",
            controlType: "ICON_TABS",
            defaultValue: "horizontal",
            fullWidth: true,
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
            hidden: isAutoLayout,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Stroke",
        children: [
          {
            helpText: "Controls the stroke color of divider",
            propertyName: "dividerColor",
            label: "Color",
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
            helpText: "Controls the style of the divider",
            propertyName: "strokeStyle",
            label: "Style",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Solid",
                value: "solid",
                icon: "cap-solid",
              },
              {
                label: "Dashed",
                value: "dashed",
                icon: "line-dashed",
              },
              {
                label: "Dotted",
                value: "dotted",
                icon: "line-dotted",
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
            label: "Thickness",
            controlType: "INPUT_TEXT",
            placeholderText: "5",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 0, default: 0 },
            },
          },
        ],
      },
      {
        sectionName: "Cap",
        children: [
          {
            helpText: "Controls the type of divider cap",
            propertyName: "capType",
            label: "Cap",
            controlType: "DROP_DOWN",
            isJSConvertible: true,
            options: [
              {
                label: "No cap",
                value: "nc",
                icon: "cap-solid",
              },
              {
                label: "Arrow",
                value: "arrow",
                icon: "arrow-forward",
              },
              {
                label: "Dot",
                value: "dot",
                icon: "cap-dot",
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
            label: "Cap position",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              {
                startIcon: "contract-left-line",
                value: -1,
              },
              {
                startIcon: "column-freeze",
                value: 0,
                width: 48,
              },
              {
                startIcon: "contract-right-line",
                value: 1,
              },
            ],
            defaultValue: 0,
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

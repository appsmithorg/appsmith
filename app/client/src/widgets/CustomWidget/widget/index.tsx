import React from "react";

import type { DerivedPropertiesMap } from "WidgetProvider/factory";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import CustomComponent from "../component";

import IconSVG from "../icon.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";

class CustomWidget extends BaseWidget<CustomWidgetProps, WidgetState> {
  static type = "CUSTOM_WIDGET";

  static getConfig() {
    return {
      name: "Custom",
      iconSVG: IconSVG,
      needsMeta: false,
      isCanvas: false,
      tags: [WIDGET_TAGS.DISPLAY],
      searchTags: ["external"],
      isSearchWildcard: true,
    };
  }

  static getDefaults() {
    return {
      widgetName: "Custom",
      rows: 30,
      columns: 30,
      version: 1,
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Widget",
        children: [
          {
            propertyName: "editSource",
            label: "",
            controlType: "CUSTOM_WIDGET_BUTTON_CONTROL",
            isJSConvertible: false,
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Model variables",
        children: [
          {
            propertyName: "model",
            helperText: (
              <div style={{ marginTop: "10px" }}>
                This model exposes Appsmith data to the widget editor.{" "}
                <a
                  href="https://docs.appsmith.com/core-concepts/dynamic-data"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read more
                </a>
              </div>
            ),
            label: "",
            controlType: "INPUT_TEXT",
            defaultValue: "{}",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.OBJECT,
            },
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [];
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

  getWidgetView() {
    return <CustomComponent />;
  }
}

export interface CustomWidgetProps extends WidgetProps {}

export default CustomWidget;

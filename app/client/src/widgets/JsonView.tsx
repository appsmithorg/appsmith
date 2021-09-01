import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";
import JSONViewer from "../pages/Editor/QueryEditor/JSONViewer";
import { ValidationTypes } from "../constants/WidgetValidation";

class JsonViewWidget extends BaseWidget<JsonViewWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "source",
            helpText: "Sets the source object of the widget",
            label: "Source",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter text",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "collapsed",
            label: "Expand Depth",
            helpText: "Depth of nested objects to expand by default.",
            controlType: "INPUT_TEXT",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  getPageView() {
    debugger;
    let displayData = this.props.source;
    if (typeof displayData === "string") {
      try {
        displayData = JSON.parse(displayData);
      } catch (e) {
        displayData = { error: "Invalid JSON" };
      }
    }
    return <JSONViewer collapsed={this.props.collapsed} src={displayData} />;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{ this.source }}`,
    };
  }

  getWidgetType(): WidgetType {
    return "JSON_VIEW_WIDGET";
  }
}

export interface JsonViewWidgetProps extends WidgetProps {
  source: any;
  collapsed: number;
}

export default JsonViewWidget;
export const ProfiledJsonViewWidget = Sentry.withProfiler(JsonViewWidget);

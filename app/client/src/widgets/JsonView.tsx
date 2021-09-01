import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";
import JSONViewer from "../pages/Editor/QueryEditor/JSONViewer";

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
            label: "Collapsed",
            helpText: "When true, all nodes will be collapsed by default.",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      source: VALIDATION_TYPES.OBJECT,
      collapsed: VALIDATION_TYPES.BOOLEAN,
    };
  }

  getPageView() {
    return <JSONViewer src={this.props.source} />;
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
  isLoading: boolean;
}

export default JsonViewWidget;
export const ProfiledJsonViewWidget = Sentry.withProfiler(JsonViewWidget);

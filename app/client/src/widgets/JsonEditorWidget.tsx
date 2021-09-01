import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import JsonEditorComponent from "components/designSystems/appsmith/JsonEditorComponent";

export interface JsonEditorWidgetProps extends WidgetProps, WithMeta {
  isVisible: boolean;
  json: string;
}

class JsonEditorWidget extends BaseWidget<JsonEditorWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
    };
  }

  getPageView() {
    const { isVisible, widgetId } = this.props;

    return <JsonEditorComponent isVisible={isVisible} widgetId={widgetId} />;
  }

  getWidgetType(): WidgetType {
    return "JSON_EDITOR_WIDGET";
  }
}

export default JsonEditorWidget;
export const ProfiledJsonEditorWidget = Sentry.withProfiler(
  withMeta(JsonEditorWidget),
);

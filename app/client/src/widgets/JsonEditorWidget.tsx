import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import JsonEditorComponent from "components/designSystems/appsmith/JsonEditorComponent";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

export interface JsonEditorWidgetProps extends WidgetProps, WithMeta {
  defaultText: string;
  isVisible: boolean;
  jsonString: string;
}

class JsonEditorWidget extends BaseWidget<JsonEditorWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "defaultText",
            label: "Default JSON String",
            helpText: "JSON string which needs to be parsed into the widget",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.JSON },
          },
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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      jsonString: "defaultText",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      jsonString: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      parsedJSON: `{{ JSON.parse(this.jsonString) }}`,
    };
  }

  getPageView() {
    const { defaultText, widgetId } = this.props;

    return (
      <JsonEditorComponent
        onChangeJSON={this.handleChangeJSON}
        onChangeText={this.handleChangeText}
        text={defaultText}
        widgetId={widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "JSON_EDITOR_WIDGET";
  }

  private handleChangeJSON = (json: any) => {
    this.props.updateWidgetMetaProperty("jsonString", json);
  };

  private handleChangeText = (text: string) => {
    try {
      this.props.updateWidgetMetaProperty("json", JSON.parse(text));
    } catch (err) {
      console.error(err);
    }
  };
}

export default JsonEditorWidget;
export const ProfiledJsonEditorWidget = Sentry.withProfiler(
  withMeta(JsonEditorWidget),
);

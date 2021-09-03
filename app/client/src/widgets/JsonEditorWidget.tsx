import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import JsonEditorComponent from "components/designSystems/appsmith/JsonEditorComponent";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function isValidJSON(
  value: unknown,
  props: JsonEditorWidgetProps,
): ValidationResponse {
  let isValid = true;
  let message = "";
  if (typeof value === "string") {
    try {
      JSON.parse(value);
    } catch (e) {
      isValid = false;
      message = "Invalid JSON data";
    }
  }

  if (isValid) {
    return {
      isValid,
      parsed: value,
    };
  }

  return {
    isValid,
    parsed: value,
    message,
  };
}

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
            propertyName: "text",
            label: "JSON data",
            helpText: "JSON object which needs to be parsed into the widget",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: isValidJSON,
                expected: {
                  type: "JSON",
                  example: JSON.stringify(
                    { fruits: ["apple", "lemon", "orange"] },
                    null,
                    2,
                  ),
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
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

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      json: undefined,
    };
  }

  getPageView() {
    const { text, widgetId } = this.props;

    return (
      <JsonEditorComponent
        onChangeJSON={this.handleChangeJSON}
        onChangeText={this.handleChangeText}
        text={text}
        widgetId={widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "JSON_EDITOR_WIDGET";
  }

  private handleChangeJSON = (json: any) => {
    this.props.updateWidgetMetaProperty("json", json);
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

import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import JsonEditorComponent from "../component";

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
          {
            propertyName: "isDisabled",
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isCopyable",
            helpText:
              "Toggle the ability to copy the current json value into the clipboard",
            label: "Allow Copy",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when clicking on save button",
            propertyName: "onSave",
            label: "onSave",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
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

  static getWidgetType(): WidgetType {
    return "JSON_EDITOR_WIDGET";
  }

  getPageView() {
    const { defaultText, isCopyable, isDisabled, widgetId } = this.props;

    return (
      <JsonEditorComponent
        copyable={isCopyable}
        disabled={isDisabled}
        onChangeJSON={this.handleChangeJSON}
        onChangeText={this.handleChangeText}
        onSave={this.handleSaveButtonClick}
        text={defaultText}
        widgetId={widgetId}
      />
    );
  }

  private handleChangeJSON = (json: any) => {
    this.props.updateWidgetMetaProperty("jsonString", JSON.stringify(json));
  };

  private handleChangeText = (text: string) => {
    this.props.updateWidgetMetaProperty("jsonString", text);
  };

  private handleSaveButtonClick = () => {
    const { onSave } = this.props;
    if (onSave) {
      super.executeAction({
        triggerPropertyName: "onSave",
        dynamicString: onSave,
        event: {
          type: EventType.ON_JSON_EDITOR_SAVE,
        },
      });
    }
  };
}

export interface JsonEditorWidgetProps extends WidgetProps {
  defaultText: string;
  isVisible: boolean;
  jsonString: string;
}

export default JsonEditorWidget;

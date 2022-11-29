import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import IframeComponent from "../component";
import { IframeWidgetProps } from "../constants";
import { Stylesheet } from "entities/AppTheming";

class IframeWidget extends BaseWidget<IframeWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "source",
            helpText: "The URL of the page to embed",
            label: "URL",
            controlType: "INPUT_TEXT",
            placeholderText: "https://docs.appsmith.com",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.SAFE_URL,
              params: {
                default: "https://www.example.com",
              },
            },
          },
          {
            propertyName: "srcDoc",
            helpText: "Inline HTML to embed, overriding the src attribute",
            label: "srcDoc",
            controlType: "INPUT_TEXT",
            placeholderText: "<p>Inline HTML</p>",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "title",
            helpText: "Label the content of the page to embed",
            label: "Title",
            controlType: "INPUT_TEXT",
            placeholderText: "Documentation",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the source URL is changed",
            propertyName: "onURLChanged",
            label: "onURLChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the srcDoc is changed",
            propertyName: "onSrcDocChanged",
            label: "onSrcDocChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when a message event is received",
            propertyName: "onMessageReceived",
            label: "onMessageReceived",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "borderColor",
            label: "Border Color",
            helpText: "Controls the color of the border",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            propertyName: "borderWidth",
            label: "Border Width (px)",
            helpText: "Controls the size of the border in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            inputType: "NUMBER",
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 0, default: 1 },
            },
          },
          {
            propertyName: "borderOpacity",
            label: "Border Opacity (%)",
            helpText: "Controls the opacity of the border in percentage",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            inputType: "NUMBER",
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 0, max: 100, default: 100 },
            },
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      message: undefined,
      messageMetadata: undefined,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  handleUrlChange = (url: string) => {
    if (url && this.props.onURLChanged) {
      super.executeAction({
        triggerPropertyName: "onURLChanged",
        dynamicString: this.props.onURLChanged,
        event: {
          type: EventType.ON_IFRAME_URL_CHANGED,
        },
      });
    }
  };

  handleSrcDocChange = (srcDoc?: string) => {
    if (srcDoc && this.props.onSrcDocChanged) {
      super.executeAction({
        triggerPropertyName: "onSrcDocChanged",
        dynamicString: this.props.onSrcDocChanged,
        event: {
          type: EventType.ON_IFRAME_SRC_DOC_CHANGED,
        },
      });
    }
  };

  handleMessageReceive = ({
    data,
    lastEventId,
    origin,
    ports,
  }: MessageEvent) => {
    this.props.updateWidgetMetaProperty("messageMetadata", {
      lastEventId,
      origin,
      ports,
    });
    this.props.updateWidgetMetaProperty("message", data, {
      triggerPropertyName: "onMessageReceived",
      dynamicString: this.props.onMessageReceived,
      event: {
        type: EventType.ON_IFRAME_MESSAGE_RECEIVED,
      },
    });
  };

  getPageView() {
    const {
      borderColor,
      borderOpacity,
      borderWidth,
      renderMode,
      source,
      srcDoc,
      title,
      widgetId,
      widgetName,
    } = this.props;

    return (
      <IframeComponent
        borderColor={borderColor}
        borderOpacity={borderOpacity}
        borderRadius={this.props.borderRadius}
        borderWidth={borderWidth}
        boxShadow={this.props.boxShadow}
        onMessageReceived={this.handleMessageReceive}
        onSrcDocChanged={this.handleSrcDocChange}
        onURLChanged={this.handleUrlChange}
        renderMode={renderMode}
        source={source}
        srcDoc={srcDoc}
        title={title}
        widgetId={widgetId}
        widgetName={widgetName}
      />
    );
  }

  static getWidgetType(): string {
    return "IFRAME_WIDGET";
  }
}

export default IframeWidget;

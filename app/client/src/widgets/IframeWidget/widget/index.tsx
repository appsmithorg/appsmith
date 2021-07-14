import React from "react";

import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import IframeComponent from "../component";
import { IframeWidgetProps } from "../constants";

class IframeWidget extends BaseWidget<IframeWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "source",
            helpText: "The URL of the page to embed",
            label: "Source",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the URL of the page to embed",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "title",
            helpText: "Label the content of the page to embed",
            label: "Title",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter the title of the page to embed",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
        ],
      },
      {
        sectionName: "Actions",
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
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "borderColor",
            label: "Border Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "borderOpacity",
            label: "Border Opacity (%)",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            inputType: "NUMBER",
            validation: VALIDATION_TYPES.NUMBER,
          },
          {
            propertyName: "borderWidth",
            label: "Border Width (px)",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            inputType: "NUMBER",
            validation: VALIDATION_TYPES.NUMBER,
          },
        ],
      },
    ];
  }

  urlChangedHandler = (url: string) => {
    if (url && this.props.onURLChanged) {
      this.props.executeAction({
        triggerPropertyName: "onURLChanged",
        dynamicString: this.props.onURLChanged,
        event: {
          type: EventType.ON_IFRAME_URL_CHANGED,
        },
      });
    }
  };

  messageReceivedHandler = (event: MessageEvent) => {
    // Accept messages only from the current iframe
    if (!this.props.source?.includes(event.origin)) {
      return;
    }
    if (this.props.onMessageReceived) {
      this.props.executeAction({
        triggerPropertyName: "onMessageReceived",
        dynamicString: this.props.onMessageReceived,
        event: {
          type: EventType.ON_IFRAME_MESSAGE_RECEIVED,
        },
      });
    }
  };

  render() {
    const {
      borderColor,
      borderOpacity,
      borderWidth,
      source,
      title,
    } = this.props;
    return (
      <IframeComponent
        borderColor={borderColor}
        borderOpacity={borderOpacity}
        borderWidth={borderWidth}
        onMessageReceived={this.messageReceivedHandler}
        onURLChanged={this.urlChangedHandler}
        source={source}
        title={title}
      />
    );
  }

  static getWidgetType(): string {
    return "IFRAME_WIDGET";
  }
}

export default IframeWidget;

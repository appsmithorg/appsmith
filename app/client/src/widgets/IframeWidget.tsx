import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import IframeComponent from "components/designSystems/blueprint/IframeComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

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
      super.executeAction({
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
      super.executeAction({
        triggerPropertyName: "onMessageReceived",
        dynamicString: this.props.onMessageReceived,
        event: {
          type: EventType.ON_IFRAME_MESSAGE_RECEIVED,
        },
      });
    }
  };

  getPageView() {
    const {
      borderColor,
      borderOpacity,
      borderWidth,
      source,
      title,
      widgetId,
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
        widgetId={widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.IFRAME_WIDGET;
  }
}

export interface IframeWidgetProps extends WidgetProps {
  source: string;
  title?: string;
  onURLChanged?: string;
  onMessageReceived?: string;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}

export default IframeWidget;
export const ProfiledIframeWidget = Sentry.withProfiler(IframeWidget);

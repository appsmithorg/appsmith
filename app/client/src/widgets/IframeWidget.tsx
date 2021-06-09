import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import IframeComponent from "components/designSystems/blueprint/IframeComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "widgets/MetaHOC";

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
            helpText: "Triggers an action when the source url is changed",
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
    console.log(url);
  };

  messageReceivedHandler = (message: MessageEvent) => {
    console.log(message);
  };

  getPageView() {
    return (
      <IframeComponent
        {...this.props}
        onMessageReceived={this.messageReceivedHandler}
        onURLChanged={this.urlChangedHandler}
      />
    );
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.IFRAME_WIDGET;
  }
}

export interface IframeWidgetProps extends WidgetProps, WithMeta {
  source: string;
  title?: string;
  onURLChanged?: string;
  onMessageReceived?: string;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}

export default IframeWidget;
export const ProfiledIframeWidget = Sentry.withProfiler(withMeta(IframeWidget));

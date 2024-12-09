import React from "react";

import BaseWidget from "widgets/BaseWidget";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { WidgetState } from "widgets/BaseWidget";
import type { AnvilConfig } from "WidgetProvider/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "../config";
import { Elevations } from "../../constants";
import type { CustomWidgetProps } from "../types";
import { ContainerComponent } from "../../Container";
import { CustomWidgetComponent } from "../component";

/**
 * Custom Widget
 *
 * Custom widget is used to render any custom component.
 *
 * How it works is, we create a full page HTML from user provided HTML, JS and CSS with the help of a template and use it for "srcDoc" prop of the iframe.
 * Appsmith sends data to the iframe by communicating with it using "postMessage" and "onMessage" events.
 *
 * For e.g - When the iframe is ready ( "window.addEventListener('load')" ), it sends a message to the parent window ( appsmith ).
 * The parent window listens to this message and then sends the model, renderMode and the iframe is also listening to these messages and initialize data accordingly.
 *
 * There are many event communications that happens between iframr and appsmith:
 * - CUSTOM_WIDGET_READY - used when the iframe is ready
 * - CUSTOM_WIDGET_UPDATE_MODEL - used when the iframe needs to update the model
 * - CUSTOM_WIDGET_TRIGGER_EVENT - used when the iframe needs to trigger an event
 * - CUSTOM_WIDGET_UPDATE_HEIGHT - used when the iframe needs to update the height. The iframe has a resizeObserver to listen to the height changes and send the height to the parent window.
 * - CUSTOM_WIDGET_CONSOLE_EVENT - used when the iframe needs to log something to the console. We use Proxy and Reflect to intercept the console.log calls and send the message to the parent window.
 */
export class WDSCustomWidget extends BaseWidget<
  CustomWidgetProps,
  WidgetState
> {
  static type = "WDS_CUSTOM_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getSetterConfig() {
    return config.setterConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.propertyPaneStyleConfig;
  }

  static getDerivedPropertiesMap() {
    return {};
  }

  static getDefaultPropertiesMap() {
    return {
      model: "defaultModel",
    };
  }

  static getMetaPropertiesMap() {
    return {
      model: undefined,
    };
  }

  onExecuteAction = (eventName: string, context: Record<string, unknown>) => {
    if (this.props.hasOwnProperty(eventName)) {
      const eventString = this.props[eventName];

      super.executeAction({
        triggerPropertyName: eventName,
        dynamicString: eventString,
        event: {
          type: EventType.CUSTOM_WIDGET_EVENT,
        },
        globalContext: context,
      });

      AnalyticsUtil.logEvent("CUSTOM_WIDGET_API_TRIGGER_EVENT", {
        widgetId: this.props.widgetId,
        eventName,
      });
    }
  };

  onUpdateModel = (data: Record<string, unknown>) => {
    this.props.updateWidgetMetaProperty("model", {
      ...this.props.model,
      ...data,
    });

    AnalyticsUtil.logEvent("CUSTOM_WIDGET_API_UPDATE_MODEL", {
      widgetId: this.props.widgetId,
    });
  };

  getRenderMode = () => {
    switch (this.props.renderMode) {
      case "CANVAS":
        return "EDITOR";
      default:
        return "DEPLOYED";
    }
  };

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  getWidgetView() {
    return (
      <ContainerComponent
        elevatedBackground
        elevation={Elevations.CARD_ELEVATION}
        noPadding
        widgetId={this.props.widgetId}
      >
        <CustomWidgetComponent
          model={this.props.model || {}}
          onTriggerEvent={this.onExecuteAction}
          onUpdateModel={this.onUpdateModel}
          renderMode={this.getRenderMode()}
          size={this.props.size}
          srcDoc={this.props.srcDoc}
          widgetId={this.props.widgetId}
        />
      </ContainerComponent>
    );
  }
}

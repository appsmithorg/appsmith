import React from "react";

import BaseWidget from "widgets/BaseWidget";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import type { AnvilConfig } from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "../config";
import CustomComponent from "../component";
import type { CustomWidgetProps } from "../types";
import { Elevations } from "../../constants";
import { ContainerComponent } from "../../Container";

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

  static getSetterConfig(): SetterConfig {
    return config.setterConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.propertyPaneStyleConfig;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      model: "defaultModel",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      model: undefined,
    };
  }

  execute = (eventName: string, contextObj: Record<string, unknown>) => {
    if (this.props.hasOwnProperty(eventName)) {
      const eventString = this.props[eventName];

      super.executeAction({
        triggerPropertyName: eventName,
        dynamicString: eventString,
        event: {
          type: EventType.CUSTOM_WIDGET_EVENT,
        },
        globalContext: contextObj,
      });

      AnalyticsUtil.logEvent("CUSTOM_WIDGET_API_TRIGGER_EVENT", {
        widgetId: this.props.widgetId,
        eventName,
      });
    }
  };

  update = (data: Record<string, unknown>) => {
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
        <CustomComponent
          execute={this.execute}
          model={this.props.model || {}}
          renderMode={this.getRenderMode()}
          size={this.props.size}
          srcDoc={this.props.srcDoc}
          update={this.update}
          widgetId={this.props.widgetId}
        />
      </ContainerComponent>
    );
  }
}

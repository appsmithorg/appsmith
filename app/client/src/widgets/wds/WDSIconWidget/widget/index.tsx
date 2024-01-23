import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import BaseWidget from "widgets/BaseWidget";
import {
  metaConfig,
  defaultsConfig,
  autocompleteConfig,
  propertyPaneContentConfig,
  settersConfig,
} from "./../config";
import type { IconWidgetProps, IconWidgetState } from "./types";
import type { AnvilConfig } from "WidgetProvider/constants";
import { Icon } from "@design-system/widgets";

class WDSIconWidget extends BaseWidget<IconWidgetProps, IconWidgetState> {
  constructor(props: IconWidgetProps) {
    super(props);
  }

  static type = "WDS_ICON_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getAutoLayoutConfig() {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "40px" },
        minWidth: { base: "40px" },
      },
    };
  }

  static getAutocompleteDefinitions() {
    return autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  getWidgetView() {
    return (
      <Icon
        filled={this.props.iconStyle === "filled"}
        key={this.props.widgetId}
        name={this.props.iconName}
      />
    );
  }
}

export { WDSIconWidget };

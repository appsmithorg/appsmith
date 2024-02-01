import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import {
  metaConfig,
  defaultsConfig,
  autocompleteConfig,
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
  settersConfig,
  anvilConfig,
} from "./../config";
import { StatBoxComponent } from "../component";
import type { StatBoxWidgetProps } from "./types";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSStatBoxWidget extends BaseWidget<StatBoxWidgetProps, WidgetState> {
  constructor(props: StatBoxWidgetProps) {
    super(props);
  }

  static type = "WDS_STATBOX_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getAutocompleteDefinitions() {
    return autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyleConfig;
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  getWidgetView() {
    return <StatBoxComponent {...this.props} />;
  }
}

export { WDSStatBoxWidget };

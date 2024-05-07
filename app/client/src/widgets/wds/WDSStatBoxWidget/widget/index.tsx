import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import * as config from "../config";
import { StatBoxComponent } from "../component";
import type { StatBoxWidgetProps } from "./types";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSStatBoxWidget extends BaseWidget<StatBoxWidgetProps, WidgetState> {
  constructor(props: StatBoxWidgetProps) {
    super(props);
  }

  static type = "WDS_STATBOX_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.propertyPaneStyleConfig;
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  getWidgetView() {
    return <StatBoxComponent {...this.props} />;
  }
}

export { WDSStatBoxWidget };

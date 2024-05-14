import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import * as config from "../config";
import type { ToolbarButtonsWidgetProps } from "./types";
import { ToolbarButtonsComponent } from "../component";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSToolbarButtonsWidget extends BaseWidget<
  ToolbarButtonsWidgetProps,
  WidgetState
> {
  constructor(props: ToolbarButtonsWidgetProps) {
    super(props);
  }

  static type = "WDS_TOOLBAR_BUTTONS_WIDGET";

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

  onButtonClick = (
    onClick: string | undefined,
    callback?: (result: ExecutionResult) => void,
  ) => {
    if (onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: callback,
        },
      });
    }

    return;
  };

  getWidgetView() {
    return (
      <ToolbarButtonsComponent
        alignment={this.props.alignment}
        buttonsList={this.props.buttonsList}
        color={this.props.color}
        key={this.props.widgetId}
        onButtonClick={this.onButtonClick}
        variant={this.props.variant}
      />
    );
  }
}

export { WDSToolbarButtonsWidget };

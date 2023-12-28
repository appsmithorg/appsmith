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
import type { ButtonGroupWidgetProps } from "./types";
import { ButtonGroupComponent } from "../component";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSButtonGroupWidget extends BaseWidget<
  ButtonGroupWidgetProps,
  WidgetState
> {
  constructor(props: ButtonGroupWidgetProps) {
    super(props);
  }

  static type = "WDS_BUTTON_GROUP_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getAutoLayoutConfig() {
    return {};
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
      <ButtonGroupComponent
        buttonsList={this.props.buttonsList}
        color={this.props.buttonColor}
        density={this.props.density}
        key={this.props.widgetId}
        onButtonClick={this.onButtonClick}
        orientation={this.props.orientation}
        variant={this.props.buttonVariant}
      />
    );
  }
}

export { WDSButtonGroupWidget };

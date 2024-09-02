import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import {
  metaConfig,
  defaultsConfig,
  autocompleteConfig,
  propertyPaneContentConfig,
  settersConfig,
  anvilConfig,
  methodsConfig,
} from "../config";
import type { InlineButtonsWidgetProps } from "./types";
import { InlineButtonsComponent } from "../component";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSInlineButtonsWidget extends BaseWidget<
  InlineButtonsWidgetProps,
  WidgetState
> {
  constructor(props: InlineButtonsWidgetProps) {
    super(props);
  }

  static type = "WDS_INLINE_BUTTONS_WIDGET";

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
    return [];
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getMethods() {
    return methodsConfig;
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
      <InlineButtonsComponent
        buttonsList={this.props.buttonsList}
        excludeFromTabOrder={this.props.disableWidgetInteraction}
        onButtonClick={this.onButtonClick}
      />
    );
  }
}

export { WDSInlineButtonsWidget };

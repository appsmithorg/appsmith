import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import BaseWidget from "widgets/BaseWidget";
import {
  metaConfig,
  defaultsConfig,
  autocompleteConfig,
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
  settersConfig,
} from "./../config";
import type { IconButtonWidgetProps, IconButtonWidgetState } from "./types";
import { IconButtonComponent } from "../component";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSIconButtonWidget extends BaseWidget<
  IconButtonWidgetProps,
  IconButtonWidgetState
> {
  constructor(props: IconButtonWidgetProps) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  static type = "WDS_ICON_BUTTON_WIDGET";

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
    return propertyPaneStyleConfig;
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  hasOnClickAction = () => {
    const { isDisabled, onClick } = this.props;

    return Boolean(onClick && !isDisabled);
  };

  handleActionComplete = () => {
    this.setState({
      isLoading: false,
    });
  };

  onButtonClick = () => {
    const { onClick } = this.props;

    if (onClick) {
      this.setState({ isLoading: true });

      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionComplete,
        },
      });

      return;
    }
  };

  getWidgetView() {
    const onPress = (() => {
      if (this.hasOnClickAction()) {
        return this.onButtonClick;
      }

      return undefined;
    })();

    return (
      <IconButtonComponent
        color={this.props.buttonColor}
        iconName={this.props.iconName}
        isDisabled={this.props.isDisabled}
        isLoading={this.state.isLoading}
        key={this.props.widgetId}
        onPress={onPress}
        tooltip={this.props.tooltip}
        variant={this.props.buttonVariant}
      />
    );
  }
}

export { WDSIconButtonWidget };

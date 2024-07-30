import React from "react";
import BaseWidget from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "./../config";
import { IconButtonComponent } from "../component";
import type { IconButtonWidgetProps, IconButtonWidgetState } from "./types";

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
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig as unknown as WidgetDefaultProps;
  }

  static getAnvilConfig() {
    return config.anvilConfig;
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

  static getMethods() {
    return config.methodsConfig;
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
        excludeFromTabOrder={this.props.disableWidgetInteraction}
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

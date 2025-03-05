import React from "react";
import { toast } from "@appsmith/ads";

import * as config from "../config";
import BaseWidget from "widgets/BaseWidget";
import ButtonComponent from "../component";
import type { AnvilConfig } from "WidgetProvider/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { ButtonWidgetProps, ButtonWidgetState } from "./types";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

class WDSButtonWidget extends BaseWidget<ButtonWidgetProps, ButtonWidgetState> {
  constructor(props: ButtonWidgetProps) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  static type = "WDS_BUTTON_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getFeatures() {
    return null;
  }

  static getDefaults() {
    return config.defaultsConfig as unknown as WidgetDefaultProps;
  }

  static getAnvilConfig(): AnvilConfig | null {
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      recaptchaToken: undefined,
    };
  }

  static getMethods() {
    return config.methodsConfig;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getSetterConfig() {
    return config.settersConfig;
  }

  onButtonClick = (onReset?: () => void) => {
    if (this.props.onClick) {
      this.setState({ isLoading: true });

      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: (result: ExecutionResult) =>
            this.handleActionComplete(result, onReset),
        },
      });

      return;
    }

    if (this.props.resetFormOnClick && onReset) {
      onReset();

      return;
    }
  };

  hasOnClickAction = () => {
    const { isDisabled, onClick, resetFormOnClick } = this.props;

    return Boolean((onClick || resetFormOnClick) && !isDisabled);
  };

  onRecaptchaSubmitSuccess = (token: string, onReset?: () => void) => {
    this.props.updateWidgetMetaProperty("recaptchaToken", token, {
      triggerPropertyName: "onClick",
      dynamicString: this.props.onClick,
      event: {
        type: EventType.ON_CLICK,
        callback: (result: ExecutionResult) =>
          this.handleActionComplete(result, onReset),
      },
    });
  };

  onRecaptchaSubmitError = (error: string) => {
    toast.show(error, { kind: "error" });

    if (this.hasOnClickAction()) {
      this.onButtonClick();
    }
  };

  handleRecaptchaV2Loading = (isLoading: boolean) => {
    if (this.props.onClick) {
      this.setState({ isLoading });
    }
  };

  handleActionComplete = (result: ExecutionResult, onReset?: () => void) => {
    this.setState({
      isLoading: false,
    });

    if (result.success) {
      if (this.props.resetFormOnClick && onReset) onReset();
    }
  };

  getWidgetView() {
    return (
      <ButtonComponent
        color={this.props.buttonColor}
        disableOnInvalidForm={this.props.disableOnInvalidForm}
        excludeFromTabOrder={this.props.disableWidgetInteraction}
        handleRecaptchaV2Loading={this.handleRecaptchaV2Loading}
        icon={this.props.iconName}
        iconPosition={this.props.iconAlign}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        onClick={this.onButtonClick}
        onRecaptchaSubmitError={this.onRecaptchaSubmitError}
        onRecaptchaSubmitSuccess={this.onRecaptchaSubmitSuccess}
        recaptchaKey={this.props.googleRecaptchaKey}
        recaptchaType={this.props.recaptchaType}
        resetFormOnClick={this.props.resetFormOnClick}
        text={this.props.text}
        tooltip={this.props.tooltip}
        variant={this.props.buttonVariant}
      />
    );
  }
}

export { WDSButtonWidget };

import React from "react";
import { toast } from "design-system";

import IconSVG from "../icon.svg";
import BaseWidget from "widgets/BaseWidget";
import ButtonComponent from "../component";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { propertyPaneStyleConfig } from "./styleConfig";
import { propertyPaneContentConfig } from "./contentConfig";
import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { ButtonWidgetProps, ButtonWidgetState } from "./types";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { COLORS, BUTTON_VARIANTS } from "@design-system/widgets";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { ButtonPlacementTypes, RecaptchaTypes } from "components/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

class WDSButtonWidget extends BaseWidget<ButtonWidgetProps, ButtonWidgetState> {
  constructor(props: ButtonWidgetProps) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  static type = "WDS_BUTTON_WIDGET";

  static getConfig() {
    return {
      name: "Button",
      iconSVG: IconSVG,
      needsMeta: false,
      isCanvas: false,
      tags: [WIDGET_TAGS.BUTTONS],
      searchTags: ["click", "submit"],
    };
  }

  static getFeatures() {
    return null;
  }

  static getDefaults() {
    return {
      animateLoading: true,
      text: "Submit",
      buttonVariant: BUTTON_VARIANTS.filled,
      buttonColor: COLORS.accent,
      placement: ButtonPlacementTypes.CENTER,
      rows: 4,
      columns: 16,
      widgetName: "Button",
      isDisabled: false,
      isVisible: true,
      isDefaultClickDisabled: true,
      disabledWhenInvalid: false,
      resetFormOnClick: false,
      recaptchaType: RecaptchaTypes.V3,
      version: 1,
      responsiveBehavior: ResponsiveBehavior.Hug,
      minWidth: BUTTON_MIN_WIDTH,
    };
  }

  static getAutoLayoutConfig() {
    return {
      defaults: {
        rows: 4,
        columns: 6.453,
      },
      autoDimension: {
        width: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "120px",
              maxWidth: "360px",
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        horizontal: true,
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: { base: "360px" },
        minHeight: { base: "40px" },
        minWidth: { base: "120px" },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Buttons are used to capture user intent and trigger actions based on that intent",
      "!url": "https://docs.appsmith.com/widget-reference/button",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      text: "string",
      isDisabled: "bool",
      recaptchaToken: "string",
    };
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyleConfig;
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      recaptchaToken: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  onButtonClick = () => {
    if (this.props.onClick) {
      this.setState({ isLoading: true });

      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionComplete,
        },
      });

      return;
    }

    if (this.props.resetFormOnClick && this.props.onReset) {
      this.props.onReset();

      return;
    }
  };

  hasOnClickAction = () => {
    const { isDisabled, onClick, onReset, resetFormOnClick } = this.props;

    return Boolean((onClick || onReset || resetFormOnClick) && !isDisabled);
  };

  onRecaptchaSubmitSuccess = (token: string) => {
    this.props.updateWidgetMetaProperty("recaptchaToken", token, {
      triggerPropertyName: "onClick",
      dynamicString: this.props.onClick,
      event: {
        type: EventType.ON_CLICK,
        callback: this.handleActionComplete,
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

  handleActionComplete = (result: ExecutionResult) => {
    this.setState({
      isLoading: false,
    });

    if (result.success) {
      if (this.props.resetFormOnClick && this.props.onReset)
        this.props.onReset();
    }
  };

  getWidgetView() {
    const isDisabled = (() => {
      const { disabledWhenInvalid, isFormValid } = this.props;
      const isDisabledWhenFormIsInvalid =
        disabledWhenInvalid && "isFormValid" in this.props && !isFormValid;

      return this.props.isDisabled || isDisabledWhenFormIsInvalid;
    })();

    const onPress = (() => {
      if (this.hasOnClickAction()) {
        return this.onButtonClick;
      }

      return undefined;
    })();

    return (
      <ButtonComponent
        color={this.props.buttonColor}
        handleRecaptchaV2Loading={this.handleRecaptchaV2Loading}
        iconName={this.props.iconName}
        iconPosition={this.props.iconAlign}
        isDisabled={isDisabled}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        maxWidth={this.props.maxWidth}
        minHeight={this.props.minHeight}
        minWidth={this.props.minWidth}
        onPress={onPress}
        onRecaptchaSubmitError={this.onRecaptchaSubmitError}
        onRecaptchaSubmitSuccess={this.onRecaptchaSubmitSuccess}
        recaptchaKey={this.props.googleRecaptchaKey}
        recaptchaType={this.props.recaptchaType}
        text={this.props.text}
        tooltip={this.props.tooltip}
        type={this.props.buttonType || "button"}
        variant={this.props.buttonVariant}
      />
    );
  }
}

export { WDSButtonWidget };

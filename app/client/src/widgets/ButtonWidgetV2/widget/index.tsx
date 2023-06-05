import React from "react";
import { toast } from "design-system";

import BaseWidget from "widgets/BaseWidget";
import ButtonComponent from "../component";
import { propertyPaneStyleConfig } from "./styleConfig";
import type { ButtonComponentProps } from "../component";
import type { RecaptchaType } from "components/constants";
import type { WidgetType } from "constants/WidgetConstants";
import { propertyPaneContentConfig } from "./contentConfig";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import type { AutocompletionDefinitions } from "widgets/constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

class ButtonWidget extends BaseWidget<ButtonWidgetProps, ButtonWidgetState> {
  onButtonClickBound: () => void;
  constructor(props: ButtonWidgetProps) {
    super(props);
    this.onButtonClickBound = this.onButtonClick.bind(this);
    this.onRecaptchaSubmitError = this.onRecaptchaSubmitError.bind(this);
    this.onRecaptchaSubmitSuccess = this.onRecaptchaSubmitSuccess.bind(this);
    this.state = {
      isLoading: false,
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

  onButtonClick() {
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
  }

  hasOnClickAction = () => {
    const { isDisabled, onClick, onReset, resetFormOnClick } = this.props;

    return Boolean((onClick || onReset || resetFormOnClick) && !isDisabled);
  };

  onRecaptchaSubmitSuccess(token: string) {
    this.props.updateWidgetMetaProperty("recaptchaToken", token, {
      triggerPropertyName: "onClick",
      dynamicString: this.props.onClick,
      event: {
        type: EventType.ON_CLICK,
        callback: this.handleActionComplete,
      },
    });
  }

  onRecaptchaSubmitError = (error: string) => {
    toast.show(error, { kind: "error" });

    if (this.hasOnClickAction()) {
      this.onButtonClickBound();
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

  getPageView() {
    const disabled =
      this.props.disabledWhenInvalid &&
      "isFormValid" in this.props &&
      !this.props.isFormValid;
    const isDisabled = this.props.isDisabled || disabled;

    return (
      <ButtonComponent
        handleRecaptchaV2Loading={this.handleRecaptchaV2Loading}
        iconName={this.props.iconName}
        iconPosition={this.props.iconAlign}
        isDisabled={isDisabled}
        isLoading={this.props.isLoading || this.state.isLoading}
        key={this.props.widgetId}
        onClick={this.hasOnClickAction() ? this.onButtonClickBound : undefined}
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

  static getWidgetType(): WidgetType {
    return "BUTTON_WIDGET_V2";
  }
}

export interface ButtonWidgetProps extends WidgetProps {
  text?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  resetFormOnClick?: boolean;
  googleRecaptchaKey?: string;
  recaptchaType?: RecaptchaType;
  disabledWhenInvalid?: boolean;
  buttonType?: ButtonComponentProps["type"];
  iconName?: ButtonComponentProps["iconName"];
  buttonVariant?: ButtonComponentProps["variant"];
  iconAlign?: ButtonComponentProps["iconPosition"];
}

interface ButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default ButtonWidget;

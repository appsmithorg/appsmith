import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import SignaturePadComponent from "../component";
import { SignaturePadWidgetProps } from "../constants";
import { Stylesheet } from "entities/AppTheming";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class SignaturePadWidget extends BaseWidget<
  SignaturePadWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  onSigning = (value: string) => {
    this.props.updateWidgetMetaProperty("value", value, {
      triggerPropertyName: "onSigning",
      dynamicString: this.props.onSigning,
      event: {
        type: EventType.ON_SIGNING,
      },
    });
  };

  getPageView() {
    return (
      <SignaturePadComponent
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        isDisabled={this.props.isDisabled}
        label={this.props.label}
        onSigning={this.onSigning}
        padBackgroundColor={this.props.padBackgroundColor}
        penColor={this.props.penColor}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): string {
    return "SIGNATURE_PAD_WIDGET";
  }
}

export default SignaturePadWidget;

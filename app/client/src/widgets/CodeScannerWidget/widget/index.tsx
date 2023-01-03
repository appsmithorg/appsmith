import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import CodeScannerComponent from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import { CodeScannerWidgetProps } from "../constants";
import { Stylesheet } from "entities/AppTheming";
class CodeScannerWidget extends BaseWidget<
  CodeScannerWidgetProps,
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

  onCodeDetected = (value: string) => {
    this.props.updateWidgetMetaProperty("value", value, {
      triggerPropertyName: "onCodeDetected",
      dynamicString: this.props.onCodeDetected,
      event: {
        type: EventType.ON_CODE_DETECTED,
      },
    });
  };

  getPageView() {
    return (
      <CodeScannerComponent
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        buttonColor={this.props.buttonColor || this.props.accentColor}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        isDisabled={this.props.isDisabled}
        key={this.props.widgetId}
        label={this.props.label}
        onCodeDetected={this.onCodeDetected}
        placement={this.props.placement}
        scannerLayout={this.props.scannerLayout}
        tooltip={this.props.tooltip}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "CODE_SCANNER_WIDGET";
  }
}

export type CodeScannerWidgetV2Props = CodeScannerWidgetProps;

export default CodeScannerWidget;

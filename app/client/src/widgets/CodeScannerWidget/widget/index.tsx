import React from "react";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetType } from "constants/WidgetConstants";
import CodeScannerComponent from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import type { CodeScannerWidgetProps } from "../constants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "widgets/constants";
class CodeScannerWidget extends BaseWidget<
  CodeScannerWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisable: {
          path: "isDisabled",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc": "Scan a Code",
      "!url": "https://docs.appsmith.com/reference/widgets/code-scanner",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isDisabled: "bool",
      value: "string",
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
        shouldButtonFitContent={this.isAutoLayoutMode}
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

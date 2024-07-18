import type { ChangeEvent } from "react";
import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import * as config from "./../config";
import BaseWidget from "widgets/BaseWidget";
import { Text, EditableText } from "@design-system/widgets";
import type { TextWidgetProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSParagraphWidget extends BaseWidget<TextWidgetProps, WidgetState> {
  ref: HTMLDivElement | null = null;

  static type = "WDS_PARAGRAPH_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getFeatures() {
    return config.featuresConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getMethods() {
    return config.methodsConfig;
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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{ this.text }}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  onTextChange = (event: ChangeEvent<HTMLDivElement>) => {
    this.ref?.dispatchEvent(
      new CustomEvent("WIDGET_EDIT_TEXT", {
        bubbles: true,
        cancelable: true,
        detail: {
          widgetId: this.props.widgetId,
          text: event.target.textContent,
        },
      }),
    );
  };

  getWidgetView() {
    return (
      <EditableText
        contentEditable={this.props.isWidgetSelected}
        onBlur={this.onTextChange}
        ref={(ref) => (this.ref = ref)}
      >
        <Text
          isBold={this.props?.fontStyle?.includes("bold")}
          isItalic={this.props?.fontStyle?.includes("italic")}
          lineClamp={this.props.lineClamp ? this.props.lineClamp : undefined}
          size={this.props.fontSize}
          textAlign={this.props.textAlign}
          title={this.props.lineClamp ? this.props.text : undefined}
        >
          {this.props.text}
        </Text>
      </EditableText>
    );
  }
}

export { WDSParagraphWidget };

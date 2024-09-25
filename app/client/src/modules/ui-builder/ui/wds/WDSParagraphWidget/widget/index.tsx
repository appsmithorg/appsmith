import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";

import * as config from "./../config";
import BaseWidget from "widgets/BaseWidget";
import { Flex, Text } from "@appsmith/wds";
import type { TextWidgetProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSParagraphWidget extends BaseWidget<TextWidgetProps, WidgetState> {
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  getWidgetView() {
    return (
      <Flex direction="column" width="100%">
        <Text
          isBold={this.props?.fontStyle?.includes("bold")}
          isItalic={this.props?.fontStyle?.includes("italic")}
          lineClamp={this.props.lineClamp ? this.props.lineClamp : undefined}
          size={this.props.fontSize}
          textAlign={this.props.textAlign}
          title={this.props.lineClamp ? this.props.text : undefined}
          wordBreak="break-word"
        >
          {this.props.text}
        </Text>
      </Flex>
    );
  }
}

export { WDSParagraphWidget };

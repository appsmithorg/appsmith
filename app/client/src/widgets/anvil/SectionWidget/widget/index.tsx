import type {
  AnvilConfig,
  AutocompletionDefinitions,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import {
  anvilConfig,
  baseConfig,
  defaultConfig,
  propertyPaneContent,
  propertyPaneStyle,
} from "./config";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import BaseWidget from "widgets/BaseWidget";
import type { ReactNode } from "react";
import React from "react";
import ContainerComponent from "widgets/ContainerWidget/component";
import { LayoutProvider } from "layoutSystems/anvil/layoutComponents/LayoutProvider";

class SectionWidget extends BaseWidget<SectionWidgetProps, WidgetState> {
  static type = "SECTION_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return baseConfig;
  }

  static getDefaults(): WidgetDefaultProps {
    return defaultConfig;
  }

  static getPropertyPaneConfig() {
    return [];
  }
  static getPropertyPaneContentConfig() {
    return propertyPaneContent;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyle;
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  static getSetterConfig(): SetterConfig | null {
    return null;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  getWidgetView(): ReactNode {
    return (
      <ContainerComponent {...this.props} noScroll>
        <LayoutProvider {...this.props} />
      </ContainerComponent>
    );
  }
}

export interface SectionWidgetProps extends ContainerWidgetProps<WidgetProps> {
  layout: LayoutProps[];
}

export default SectionWidget;

import React, { type ReactNode } from "react";
import type {
  AnvilConfig,
  AutoLayoutConfig,
  AutocompletionDefinitions,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import {
  anvilConfig,
  baseConfig,
  defaultConfig,
  propertyPaneContent,
  propertyPaneStyle,
} from "./config";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import ContainerComponent from "widgets/anvil/Container";
import { LayoutProvider } from "layoutSystems/anvil/layoutComponents/LayoutProvider";
import { anvilWidgets } from "widgets/anvil/constants";

class ZoneWidget extends BaseWidget<ZoneWidgetProps, WidgetState> {
  static type = anvilWidgets.ZONE_WIDGET;

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

  static getAutoLayoutConfig(): AutoLayoutConfig | null {
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

export interface ZoneWidgetProps extends ContainerWidgetProps<WidgetProps> {
  layout: LayoutProps[];
}

export default ZoneWidget;

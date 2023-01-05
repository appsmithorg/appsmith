import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import SpacingComponent from "../component";

class SpacingWidget extends BaseWidget<
  WidgetProps /*SpacingWidgetProps*/,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [];
  }

  static getPropertyPaneStyleConfig() {
    return [];
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

  getPageView() {
    return <SpacingComponent />;
  }

  static getWidgetType(): string {
    return "SPACING_WIDGET";
  }
}

//export interface SpacingWidgetProps extends WidgetProps {}

export default SpacingWidget;

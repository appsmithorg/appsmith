import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import ProgressComponent from "../component";
import { ProgressVariantType } from "../constants";

class ProgressWidget extends BaseWidget<ProgressWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
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
    const { variant } = this.props;
    return <ProgressComponent variant={variant} />;
  }

  static getWidgetType(): string {
    return "PROGRESS_WIDGET";
  }
}

export interface ProgressWidgetProps extends WidgetProps {
  variant: ProgressVariantType;
}

export default ProgressWidget;

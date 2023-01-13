import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import NotificationButtonComponent from "../component";

class NotificationButtonWidget extends BaseWidget<
  NotificationButtonWidgetProps,
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
    const width = 100;
    return <NotificationButtonComponent width={width} />;
  }

  static getWidgetType(): string {
    return "NOTIFICATIONBUTTON_WIDGET";
  }
}

export interface NotificationButtonWidgetProps extends WidgetProps {
  isDisabled?: boolean;
  isVisible?: boolean;
}

export default NotificationButtonWidget;

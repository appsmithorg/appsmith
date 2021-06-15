import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

import MenuComponent from "components/designSystems/blueprint/MenuComponent";

export interface MenuWidgetProps extends WidgetProps {
  label: string;
}

class MenuWidget extends BaseWidget<MenuWidgetProps, WidgetState> {
  getPageView() {
    const { label, widgetId } = this.props;
    return <MenuComponent label={label} widgetId={widgetId} />;
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.MENU_WIDGET;
  }
}

export default MenuWidget;
export const ProfiledMenuWidget = Sentry.withProfiler(MenuWidget);

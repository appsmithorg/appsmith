import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import * as Sentry from "@sentry/react";
import withMeta from "./MetaHOC";
import { Switch } from "@blueprintjs/core";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

class SwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
  getPageView() {
    return <Switch />;
  }

  getWidgetType(): WidgetType {
    return "SWITCH_WIDGET";
  }

  getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      defaultCheckedState: VALIDATION_TYPES.BOOLEAN,
    };
  }
}

export interface SwitchWidgetProps extends WidgetProps {
  isOn: boolean;
  label: string;
}

export default SwitchWidget;
export const ProfiledSwitchWidget = Sentry.withProfiler(withMeta(SwitchWidget));

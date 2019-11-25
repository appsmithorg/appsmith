import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";

class SwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
  getPageView() {
    return <div />;
  }

  getWidgetType(): WidgetType {
    return "SWITCH_WIDGET";
  }
}

export interface SwitchWidgetProps extends WidgetProps {
  isOn: boolean;
  label: string;
}

export default SwitchWidget;

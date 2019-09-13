import React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";

class SwitchWidget extends BaseWidget<
  SwitchWidgetProps,
  IWidgetState
> {

  getPageView() {
    return (
      <div/>
    );
  }

  getWidgetType(): WidgetType {
    return "SWITCH_WIDGET";
  }
}

export interface SwitchWidgetProps extends IWidgetProps {
  isOn: boolean
  label: string
}

export default SwitchWidget;

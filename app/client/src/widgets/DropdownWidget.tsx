import React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, IWidgetState> {

  getPageView() {
    return (
      <div/>
    );
  }

  getWidgetType(): WidgetType {
    return "DROP_DOWN_WIDGET";
  }
}

export type SelectionType = "SINGLE_SELECT" | "MULTI_SELECT>"
export interface DropdownOption {
  label: string
  value: string
}

export interface DropdownWidgetProps extends IWidgetProps {
  placeholder?: string;
  label?: string
  type: SelectionType
  options?: DropdownOption[]
}

export default DropdownWidget;

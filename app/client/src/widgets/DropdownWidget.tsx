import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { ActionPayload } from "../constants/ActionConstants";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  getPageView() {
    return <div />;
  }

  getWidgetType(): WidgetType {
    return "DROP_DOWN_WIDGET";
  }
}

export type SelectionType = "SINGLE_SELECT" | "MULTI_SELECT>";
export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownWidgetProps extends WidgetProps {
  placeholder?: string;
  label?: string;
  type: SelectionType;
  options?: DropdownOption[];
  onOptionSelected?: ActionPayload[];
}

export default DropdownWidget;

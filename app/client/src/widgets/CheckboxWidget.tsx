import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import CheckboxComponent from "../editorComponents/CheckboxComponent";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  getPageView() {
    return (
      <CheckboxComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        items={this.props.items}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET";
  }
}

export interface CheckboxWidgetProps extends WidgetProps {
  items: Array<{
    label: string;
    key: string;
    defaultIndeterminate: boolean;
    value: number | string;
  }>;
}

export default CheckboxWidget;

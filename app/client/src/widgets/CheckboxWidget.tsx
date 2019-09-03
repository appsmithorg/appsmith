import React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import CheckboxComponent from "../editorComponents/CheckboxComponent"

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, IWidgetState> {
  getPageView() {
    return (
      <CheckboxComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        items={this.props.items}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "ICON_WIDGET"
  }
}

export interface CheckboxWidgetProps extends IWidgetProps {
  items: Array<{
    label: string;
    defaultIndeterminate: boolean;
    value: number | string;
  }>;
}

export default CheckboxWidget

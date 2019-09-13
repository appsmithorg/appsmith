import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import CheckboxComponent from "../editorComponents/CheckboxComponent";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  getPageView() {
    return (
      <CheckboxComponent
        style={this.getPositionStyle()}
        defaultCheckedState={this.props.defaultCheckedState}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET";
  }
}

export interface CheckboxWidgetProps extends WidgetProps {
  label: string;
  defaultCheckedState: boolean;
}

export default CheckboxWidget;

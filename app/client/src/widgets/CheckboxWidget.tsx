import React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import CheckboxComponent from "../editorComponents/CheckboxComponent"
import { ActionPayload } from '../constants/ActionConstants';

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, IWidgetState> {
  getPageView() {
    return (
      <CheckboxComponent
        style={this.getPositionStyle()}
        defaultCheckedState={this.props.defaultCheckedState}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET"
  }
}

export interface CheckboxWidgetProps extends IWidgetProps {
  label: string
  defaultCheckedState: boolean
  onCheckChange?: ActionPayload[]
}

export default CheckboxWidget

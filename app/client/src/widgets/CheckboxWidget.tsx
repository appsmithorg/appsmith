import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType, CSSUnits } from "../constants/WidgetConstants"
import { Icon, Intent } from "@blueprintjs/core"
import { IconName } from "@blueprintjs/icons"
import CheckboxComponent from "../editorComponents/CheckboxComponent"
import _ from "lodash"

class CheckboxWidget extends BaseWidget<ICheckboxWidgetProps, IWidgetState> {
  constructor(widgetProps: ICheckboxWidgetProps) {
    super(widgetProps)
  }

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

export interface ICheckboxWidgetProps extends IWidgetProps {
  items: Array<{
    label: string
    defaultIndeterminate: boolean
    value: number | string
  }>
}

export default CheckboxWidget

import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import RadioGroupComponent from "../editorComponents/RadioGroupComponent"
import { IOptionProps } from "@blueprintjs/core"
import { ActionPayload } from '../constants/ActionConstants';

class RadioGroupWidget extends BaseWidget<
  RadioGroupWidgetProps,
  IWidgetState
> {

  getPageView() {
    return (
      <RadioGroupComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        label={this.props.label}
        defaultOptionValue={this.props.defaultOptionValue}
        options={this.props.options}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "RADIO_GROUP_WIDGET"
  }
}

export interface RadioOption {
  label: string
  value: string
}

export interface RadioGroupWidgetProps extends IWidgetProps {
  label: string
  options: RadioOption[]
  defaultOptionValue: string
  onOptionSelected?: ActionPayload[]
}

export default RadioGroupWidget

import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType, CSSUnits } from "../constants/WidgetConstants"
import ButtonComponent from "../editorComponents/ButtonComponent"
import _ from "lodash"
import WidgetFactory from "../utils/WidgetFactory";

class ButtonWidget extends BaseWidget<IButtonWidgetProps, IWidgetState> {
  constructor(widgetProps: IButtonWidgetProps) {
    super(widgetProps)
  }

  getPageView() {
    return (
      <ButtonComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        text={this.props.text}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "BUTTON_WIDGET"
  }
}

export interface IButtonWidgetProps extends IWidgetProps {
  text?: string
  ellipsize?: boolean
}

export default ButtonWidget

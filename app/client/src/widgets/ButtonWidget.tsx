import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import ButtonComponent from "../editorComponents/ButtonComponent"

class ButtonWidget extends BaseWidget<ButtonWidgetProps, IWidgetState> {

  getPageView() {
    return (
      <ButtonComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        text={this.props.text || "Button"}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "BUTTON_WIDGET"
  }
}

export interface ButtonWidgetProps extends IWidgetProps {
  text?: string;
  ellipsize?: boolean;
}

export default ButtonWidget

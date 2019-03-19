import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType, CSSUnits } from "../constants/WidgetConstants"
import TextComponent from "../editorComponents/TextComponent"
import _ from "lodash"

class TextWidget extends BaseWidget<ITextWidgetProps, IWidgetState> {
  constructor(widgetProps: ITextWidgetProps) {
    super(widgetProps)
  }

  getPageView() {
    return (
      <TextComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        text={this.props.text}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "TEXT_WIDGET"
  }
}

export interface ITextWidgetProps extends IWidgetProps {
  text?: string
  ellipsize?: boolean
}

export default TextWidget

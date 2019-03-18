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

  getWidgetView() {
    return (
      <ButtonComponent
        style={{
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
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

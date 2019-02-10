import * as React from "react"
import BaseWidget, { IWidgetProps } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import TextComponent, {
  ITextComponentProps
} from "../editorComponents/TextComponent"
import _ from "lodash"

class TextWidget extends BaseWidget<ITextWidgetProps, ITextComponentProps> {
  constructor(widgetProps: ITextWidgetProps) {
    super(widgetProps)
  }

  getComponentProps(): ITextComponentProps {
    return {
      widgetId: this.widgetData.widgetId,
      text: !_.isNil(this.widgetData.text) ? this.widgetData.text : "Hello World",
      ellipsize: this.widgetData.ellipsize === true
    }
  }

  getWidgetView(): any {
    return (
      <TextComponent
        key={this.widgetData.widgetId}
        {...this.getComponentProps()}
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

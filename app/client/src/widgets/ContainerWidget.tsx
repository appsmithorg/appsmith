import * as React from "react"
import BaseWidget, { IWidgetProps } from "./BaseWidget"
import ContainerComponent, {
  IContainerProps
} from "../editorComponents/ContainerComponent"
import { ContainerOrientation, WidgetType } from "../constants/WidgetConstants"
import WidgetFactory from "../utils/WidgetFactory"

class ContainerWidget extends BaseWidget<
  IContainerWidgetProps<IWidgetProps>,
  IContainerProps
> {
  constructor(widgetProps: IContainerWidgetProps<IWidgetProps>) {
    super(widgetProps)
    this.widgetData.snapColumns = 13
    this.widgetData.snapColumnSpace = this.width / this.widgetData.snapColumns
    this.widgetData.snapRowSpace = 100
    this.widgetData.snapRows = this.height / this.widgetData.snapRowSpace
  }

  getComponentProps(): IContainerProps {
    return {
      widgetId: this.widgetData.widgetId,
      snapColumnSpace: this.widgetData.snapColumnSpace,
      snapRowSpace: this.widgetData.snapRowSpace,
      snapColumns: this.widgetData.snapColumns,
      snapRows: this.widgetData.snapRows,
      orientation: this.widgetData.orientation
    }
  }

  getWidgetView(): any {
    return (
      <ContainerComponent {...this.getComponentProps()}>
        {this.widgetData.children
          ? this.widgetData.children.map(childWidgetData => {
              childWidgetData.parentColumnSpace = this.widgetData
                .snapColumnSpace
                ? this.widgetData.snapColumnSpace
                : 0
              childWidgetData.parentRowSpace = this.widgetData.snapRowSpace
                ? this.widgetData.snapRowSpace
                : 0
              return WidgetFactory.createWidget(childWidgetData).getWidgetView()
            })
          : undefined}
      </ContainerComponent>
    )
  }

  getWidgetType(): WidgetType {
    return "CONTAINER_WIDGET"
  }
}

export interface IContainerWidgetProps<T extends IWidgetProps> extends IWidgetProps {
  children?: T[]
  snapColumnSpace?: number
  snapRowSpace?: number
  snapColumns?: number
  snapRows?: number
  orientation?: ContainerOrientation
}

export default ContainerWidget

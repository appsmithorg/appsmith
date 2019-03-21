import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import ContainerComponent, {
  IContainerProps
} from "../editorComponents/ContainerComponent"
import {
  ContainerOrientation,
  WidgetType,
  CSSUnits
} from "../constants/WidgetConstants"
import WidgetFactory from "../utils/WidgetFactory"
import React from "react"
import _ from "lodash"
import { Color } from "../constants/StyleConstants"

const DEFAULT_NUM_COLS = 13
const DEFAULT_NUM_ROWS = 13

class ContainerWidget extends BaseWidget<
  IContainerWidgetProps<IWidgetProps>,
  IWidgetState
> {
  snapColumnSpace: number = 100
  snapRowSpace: number = 100

  constructor(props: IContainerWidgetProps<IWidgetProps>) {
    super(props)
    this.renderChildWidget = this.renderChildWidget.bind(this)
    this.state = {
      width: 0,
      height: 0
    }
  }

  componentDidUpdate(previousProps: IContainerWidgetProps<IWidgetProps>) {
    super.componentDidUpdate(previousProps)
    if (this.state.width)
      this.snapColumnSpace =
        this.state.width / (this.props.snapColumns || DEFAULT_NUM_COLS)
    if (this.state.height)
      this.snapRowSpace =
        this.state.height / (this.props.snapRows || DEFAULT_NUM_ROWS)
  }

  renderChildWidget(childWidgetData: IWidgetProps) {
    childWidgetData.parentColumnSpace = this.snapColumnSpace
    childWidgetData.parentRowSpace = this.snapRowSpace
    return WidgetFactory.createWidget(childWidgetData)
  }

  getPageView() {
    return (
      <ContainerComponent
        widgetId={this.props.widgetId}
        style={{
          ...this.getPositionStyle(),
          backgroundColor: this.props.backgroundColor
        }}
        orientation={this.props.orientation || "VERTICAL"}
      >
        {_.map(this.props.children, this.renderChildWidget)}
      </ContainerComponent>
    )
  }

  getWidgetType(): WidgetType {
    return "CONTAINER_WIDGET"
  }
}

export interface IContainerWidgetProps<T extends IWidgetProps>
  extends IWidgetProps {
  children?: T[]
  snapColumns?: number
  snapRows?: number
  orientation?: ContainerOrientation
  backgroundColor?: Color
}

export default ContainerWidget

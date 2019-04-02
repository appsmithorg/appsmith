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
import DroppableComponent from "../editorComponents/DroppableComponent"

const DEFAULT_NUM_COLS = 13
const DEFAULT_NUM_ROWS = 13

class ContainerWidget extends BaseWidget<
  IContainerWidgetProps<IWidgetProps>,
  IContainerWidgetState
> {
  constructor(props: IContainerWidgetProps<IWidgetProps>) {
    super(props)
    this.renderChildWidget = this.renderChildWidget.bind(this)
    this.state = {
      width: 0,
      height: 0,
      snapColumnSpace: 1,
      snapRowSpace: 1
    }
  }

  componentDidUpdate(previousProps: IContainerWidgetProps<IWidgetProps>) {
    super.componentDidUpdate(previousProps)
    let snapColumnSpace = this.state.snapColumnSpace
    let snapRowSpace = this.state.snapRowSpace
    if (this.state.width)
      snapColumnSpace =
        this.state.width / (this.props.snapColumns || DEFAULT_NUM_COLS)
    if (this.state.height)
      snapRowSpace =
        this.state.height / (this.props.snapRows || DEFAULT_NUM_ROWS)
    if (
      this.state.snapColumnSpace !== snapColumnSpace ||
      this.state.snapRowSpace !== snapRowSpace
    ) {
      this.setState({
        snapColumnSpace: snapColumnSpace,
        snapRowSpace: snapRowSpace
      })
    }
  }

  renderChildWidget(childWidgetData: IWidgetProps) {
    childWidgetData.parentColumnSpace = this.state.snapColumnSpace
    childWidgetData.parentRowSpace = this.state.snapRowSpace
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

  getCanvasView() {
    return (
      <DroppableComponent
        {...this.props}
        style={{
          ...this.getPositionStyle()
        }}
      >
        {super.getCanvasView()}
      </DroppableComponent>
    )
  }

  getWidgetType(): WidgetType {
    return "CONTAINER_WIDGET"
  }
}

export interface IContainerWidgetState extends IWidgetState {
  snapColumnSpace: number
  snapRowSpace: number
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

import React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import ContainerComponent from "../editorComponents/ContainerComponent"
import {
  ContainerOrientation,
  WidgetType,
} from "../constants/WidgetConstants"
import WidgetFactory from "../utils/WidgetFactory"
import _ from "lodash"
import { Color } from "../constants/DefaultTheme"
import DroppableComponent from "../editorComponents/DroppableComponent"

const DEFAULT_NUM_COLS = 16
const DEFAULT_NUM_ROWS = 16

class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<IWidgetProps>,
  ContainerWidgetState
> {
  constructor(props: ContainerWidgetProps<IWidgetProps>) {
    super(props)
    this.renderChildWidget = this.renderChildWidget.bind(this)
    this.state = {
      width: 0,
      height: 0,
      snapColumnSpace: DEFAULT_NUM_COLS,
      snapRowSpace: DEFAULT_NUM_ROWS
    }
  }

  componentDidUpdate(previousProps: ContainerWidgetProps<IWidgetProps>) {
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
          ...this.getPositionStyle()
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

export interface ContainerWidgetState extends IWidgetState {
  snapColumnSpace: number;
  snapRowSpace: number;
}

export interface ContainerWidgetProps<T extends IWidgetProps>
  extends IWidgetProps {
  children?: T[];
  snapColumns?: number;
  snapRows?: number;
  orientation?: ContainerOrientation;
  backgroundColor?: Color;
}

export default ContainerWidget

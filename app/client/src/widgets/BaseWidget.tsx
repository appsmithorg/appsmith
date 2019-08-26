/***
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import {
  WidgetType,
  RenderMode,
  RenderModes,
  CSSUnits
} from "../constants/WidgetConstants"
import { Component } from "react"
import { BaseStyle } from "../editorComponents/BaseComponent"
import _ from "lodash"
import * as React from "react"
import ContainerWidget from "./ContainerWidget"
import ContainerComponent from "../editorComponents/ContainerComponent"
import DraggableComponent from "../editorComponents/DraggableComponent"

abstract class BaseWidget<
  T extends IWidgetProps,
  K extends IWidgetState
> extends Component<T, K> {
  constructor(props: T) {
    super(props)
    const initialState: IWidgetState = {
      height: 0,
      width: 0
    }
    initialState.height = 0
    initialState.width = 0
    this.state = initialState as K
  }

  componentDidMount(): void {
    this.calculateWidgetBounds(
      this.props.rightColumn,
      this.props.leftColumn,
      this.props.topRow,
      this.props.bottomRow,
      this.props.parentColumnSpace,
      this.props.parentRowSpace
    )
  }

  componentDidUpdate(prevProps: T) {
    this.calculateWidgetBounds(
      this.props.rightColumn,
      this.props.leftColumn,
      this.props.topRow,
      this.props.bottomRow,
      this.props.parentColumnSpace,
      this.props.parentRowSpace
    )
  }

  calculateWidgetBounds(
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number
  ) {
    const widgetState: IWidgetState = {
      width: (rightColumn - leftColumn) * parentColumnSpace,
      height: (bottomRow - topRow) * parentRowSpace
    }
    if (
      _.isNil(this.state) ||
      widgetState.height !== this.state.height ||
      widgetState.width !== this.state.width
    ) {
      // console.log("*** " + this.props.widgetId + " " + JSON.stringify(widgetState))
      this.setState(widgetState)
    }
  }

  render() {
    return this.getWidgetView()
  }

  getWidgetView(): JSX.Element {
    switch (this.props.renderMode) {
      case RenderModes.CANVAS:
        return this.getCanvasView()
      case RenderModes.COMPONENT_PANE:
        return this.getComponentPaneView()
      case RenderModes.PAGE:
        return this.getPageView()
      default:
        return this.getPageView()
    }
  }

  abstract getPageView(): JSX.Element

  getCanvasView(): JSX.Element {
    return this.getPageView()
  }

  getComponentPaneView(): JSX.Element {
    return (
      <DraggableComponent
        {...this.props}
        style={{
          ...this.getPositionStyle()
        }}
        orientation={"VERTICAL"}
      >
        {this.getPageView()}
      </DraggableComponent>
    )
  }

  abstract getWidgetType(): WidgetType

  getPositionStyle(): BaseStyle {
    return {
      positionType:
        this.props.renderMode !== RenderModes.PAGE
          ? "CONTAINER_DIRECTION"
          : "ABSOLUTE",
      height: this.state.height,
      width: this.state.width,
      yPosition: this.props.topRow * this.props.parentRowSpace,
      xPosition: this.props.leftColumn * this.props.parentColumnSpace,
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL
    }
  }

  static defaultProps: Partial<IWidgetProps> = {
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0
  }
}

export interface IWidgetState {
  height: number
  width: number
}

export interface DraggableWidget {
  type: string,
  widget: IWidgetProps
}

export interface IWidgetBuilder<T extends IWidgetProps> {
  buildWidget(data: T): JSX.Element
}

export interface IWidgetProps {
  widgetType: WidgetType
  key?: string
  widgetId: string
  topRow: number
  leftColumn: number
  bottomRow: number
  rightColumn: number
  parentColumnSpace: number
  parentRowSpace: number
  renderMode: RenderMode
}

export interface IWidgetCardProps {
  widgetType: WidgetType
  key?: string
  label: string
  icon: string
  groups: string[]
}

export default BaseWidget

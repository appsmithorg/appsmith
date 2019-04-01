import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import _ from "lodash"
import { DragSource, DragSourceConnector, DragSourceMonitor } from "react-dnd"
import ContainerWidget, { IContainerWidgetProps } from "./ContainerWidget"
import { IContainerProps } from "../editorComponents/ContainerComponent"
import styled from "../constants/DefaultTheme"

export interface DraggableWidgetProps extends IContainerProps {
  connectDragSource: Function
  isDragging?: boolean
}

export const Container = styled("div")<IContainerProps>`
  display: "flex"
  flexDirection: ${props => {
    return props.orientation === "HORIZONTAL" ? "row" : "column"
  }};
  background: ${props => props.style.backgroundColor};
  color: ${props => props.theme.primaryColor};
  position: ${props => {
    return props.style.positionType === "ABSOLUTE" ? "absolute" : "relative"
  }};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit
  }};
`

class DraggableWidget extends React.Component<
  DraggableWidgetProps,
  IWidgetState
> {
  render() {
    return this.props.connectDragSource(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: this.props.style ? this.props.style.xPosition + this.props.style.xPositionUnit:0,
          top: this.props.style ? this.props.style.yPosition + this.props.style.yPositionUnit: 0
        }}
      >
        {this.props.children}
      </div>
    )
  }
}

const widgetSource = {
  beginDrag(props: IWidgetProps) {
    return {
      widgetId: props.widgetId
    }
  }
}

const widgetType = (props: IWidgetProps) => {
  return props.widgetType
}

function collect(connect: DragSourceConnector, monitor: DragSourceMonitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }
}

export default DragSource(widgetType, widgetSource, collect)(DraggableWidget)

import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "../widgets/BaseWidget"
import _ from "lodash"
import { DragSource, DragSourceConnector, DragSourceMonitor } from "react-dnd"
import { IContainerProps } from "./ContainerComponent"

export interface IDraggableProps extends IContainerProps {
  connectDragSource: Function
  isDragging?: boolean
}

class DraggableComponent extends React.Component<
  IDraggableProps,
  IWidgetState
> {
  render() {
    return this.props.connectDragSource(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: this.props.style
            ? this.props.style.xPosition + this.props.style.xPositionUnit
            : 0,
          top: this.props.style
            ? this.props.style.yPosition + this.props.style.yPositionUnit
            : 0
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
      widgetId: props.widgetId,
      widgetType: props.widgetType
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

export default DragSource(widgetType, widgetSource, collect)(DraggableComponent)

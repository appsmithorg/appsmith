import React, { Props } from "react"
import WidgetFactory from "../../utils/WidgetFactory"
import { WidgetTypes } from "../../constants/WidgetConstants"
import { DraggableWidget } from "../../widgets/BaseWidget"
import { useDrop } from 'react-dnd'
import { IContainerWidgetProps } from "../../widgets/ContainerWidget"

interface CanvasProps {
  pageWidget: IContainerWidgetProps<any>
  addWidget: Function
  removeWidget: Function
}

const Canvas : React.SFC<CanvasProps> = (props) => {
  const [, drop] = useDrop({
    accept: Object.values(WidgetTypes),
    drop(item: DraggableWidget, monitor) {
      console.log("dropped")
      props.addWidget(item.type);
      return undefined
    },
  })
  return (
    <div ref={drop}>
      {props.pageWidget && WidgetFactory.createWidget(props.pageWidget)}
    </div>
  )
}

export default Canvas
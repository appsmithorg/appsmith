import React, { MutableRefObject, useLayoutEffect } from "react"
import styled from "styled-components"
import WidgetFactory from "../../utils/WidgetFactory"
import { WidgetTypes } from "../../constants/WidgetConstants"
import { DraggableWidget } from "../../widgets/BaseWidget"
import { useDrop } from "react-dnd"
import { ContainerWidgetProps } from "../../widgets/ContainerWidget"
import EditorDragLayer from "./EditorDragLayer"

const ArtBoardBackgroundMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  z-index: -10;
`;

const ArtBoard = styled.div<ArtBoardProps>`
  width: 100%;
  height: 100%;
  position:relative;
  overflow: auto;
  background: linear-gradient(
    90deg, 
    transparent, 
    transparent 1px, 
    #ffffff 1px, 
    #ffffff 63px,
    transparent 63px, 
    transparent 100%),
  linear-gradient(
    transparent, 
    transparent 1px, 
    #ffffff 1px, 
    #ffffff 63px, 
    transparent 63px, 
    transparent 100%), black;
background-size: 64px 64px;
background-position:0 0;
`;

interface CanvasProps {
  pageWidget: ContainerWidgetProps<any>;
  addWidget: Function;
}

interface ArtBoardProps {
  cellSize: string;
}

const Canvas = (props: CanvasProps) => {
  const [width, setWidth] = React.useState(1)
  const artBoardMask: MutableRefObject<HTMLDivElement | null> = React.useRef(null)
  const [, drop] = useDrop({
    accept: Object.values(WidgetTypes),
    drop(item: DraggableWidget) {
      props.addWidget(item.type, item.key);
      return undefined
    },
  })

  useLayoutEffect(() => {
    const el = artBoardMask.current
    if (el) {
      const rect = el.getBoundingClientRect()
      setWidth(rect.width)
    }
  }, [setWidth])

  return (
    <React.Fragment>
      <EditorDragLayer />
      <ArtBoard ref={drop} cellSize={(Math.floor(width / 16) - 1) + "px"}>
        <ArtBoardBackgroundMask ref={artBoardMask}></ArtBoardBackgroundMask>
        {props.pageWidget && WidgetFactory.createWidget(props.pageWidget)}
      </ArtBoard>
    </React.Fragment>
  )
}

export default Canvas
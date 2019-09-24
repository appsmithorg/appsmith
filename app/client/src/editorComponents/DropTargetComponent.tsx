import React, { useState, useLayoutEffect, MutableRefObject } from "react";
import styled from "styled-components";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { useDrop } from "react-dnd";
import { ContainerProps } from "./ContainerComponent";
import WidgetFactory from "../utils/WidgetFactory";
import { snapToGrid } from "../utils/helpers";
import DragLayerComponent from "./DragLayerComponent";

import { GridDefaults } from "../constants/WidgetConstants";

const {
  DEFAULT_CELL_SIZE,
  DEFAULT_WIDGET_HEIGHT,
  DEFAULT_WIDGET_WIDTH,
} = GridDefaults;

type DropTargetComponentProps = ContainerProps & {
  updateWidget?: Function;
};

const WrappedDropTarget = styled.div`
  background: white;
`;
const DropTargetMask = styled.div`
  position: absolute;
  z-index: -10;
  left: 0;
  right: 0;
`;

export const DropTargetComponent = (props: DropTargetComponentProps) => {
  const [dropTargetTopLeft, setDropTargetTopLeft] = useState({ x: 0, y: 0 });
  const dropTargetMask: MutableRefObject<HTMLDivElement | null> = React.useRef(
    null,
  );
  useLayoutEffect(() => {
    const el = dropTargetMask.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropTargetTopLeft({
        x: rect.left,
        y: rect.top,
      });
    }
  }, [setDropTargetTopLeft]);

  const [{ isOver }, drop] = useDrop({
    accept: Object.values(WidgetFactory.getWidgetTypes()),
    drop(widget: WidgetProps, monitor) {
      if (monitor.isOver({ shallow: true })) {
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          const [x, y] = snapToGrid(
            DEFAULT_CELL_SIZE,
            clientOffset.x - dropTargetTopLeft.x,
            clientOffset.y - dropTargetTopLeft.y,
          );
          if (widget.widgetId) {
            props.updateWidget &&
              props.updateWidget(WidgetOperations.MOVE, widget.widgetId, {
                left: x,
                top: y,
              });
          } else {
            props.updateWidget &&
              props.updateWidget(WidgetOperations.ADD_CHILD, props.widgetId, {
                type: widget.type,
                left: x,
                top: y,
                width:
                  Math.round(DEFAULT_WIDGET_WIDTH / DEFAULT_CELL_SIZE) *
                  DEFAULT_CELL_SIZE,
                height:
                  Math.round(DEFAULT_WIDGET_HEIGHT / DEFAULT_CELL_SIZE) *
                  DEFAULT_CELL_SIZE,
              });
          }
        }
      }
      return undefined;
    },
    collect: monitor => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
    canDrop: (widget, monitor) => {
      return monitor.isOver({ shallow: true });
    },
  });
  return (
    <WrappedDropTarget
      ref={drop}
      style={{
        left: props.style.xPosition + props.style.xPositionUnit,
        height: props.style.componentHeight,
        width: props.style.componentWidth,
        top: props.style.yPosition + props.style.yPositionUnit,
      }}
    >
      <DropTargetMask ref={dropTargetMask} />
      <DragLayerComponent
        parentOffset={dropTargetTopLeft}
        width={DEFAULT_WIDGET_WIDTH}
        height={DEFAULT_WIDGET_HEIGHT}
        cellSize={DEFAULT_CELL_SIZE}
        visible={isOver}
      />
      {props.children}
    </WrappedDropTarget>
  );
};

export default DropTargetComponent;

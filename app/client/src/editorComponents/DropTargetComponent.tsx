import React, { useState } from "react";
import { WidgetProps, WidgetDynamicProperties } from "../widgets/BaseWidget";
import { useDrop, XYCoord } from "react-dnd";
import { ContainerProps } from "./ContainerComponent";
import WidgetFactory from "../utils/WidgetFactory";
type DropTargetComponentProps = ContainerProps & {
  onPropertyChange?: Function;
};
export const DropTargetComponent = (props: DropTargetComponentProps) => {
  const [isOver, setIsOver] = useState(false);
  const [, drop] = useDrop({
    accept: Object.values(WidgetFactory.getWidgetTypes()),
    drop(item: WidgetProps, monitor) {
      if (monitor.isOver({ shallow: true })) {
        const item = monitor.getItem();
        const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
        const left = Math.round(item.left + delta.x);
        const top = Math.round(item.top + delta.y);
        props.onPropertyChange &&
          props.onPropertyChange(WidgetDynamicProperties.CHILDREN, props, {
            item,
            left,
            top,
          });
      }
      return undefined;
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    hover: (item, monitor) => {
      setIsOver(monitor.isOver({ shallow: true }));
    },
    canDrop() {
      return true;
    },
  });
  return (
    <div
      ref={drop}
      style={{
        position: "absolute",
        left: props.style.xPosition + props.style.xPositionUnit,
        height: props.style.height,
        width: props.style.width,
        background: isOver ? "#f4f4f4" : undefined,
        top: props.style.yPosition + props.style.yPositionUnit,
      }}
    >
      {isOver ? undefined : props.children}
    </div>
  );
};

export default DropTargetComponent;

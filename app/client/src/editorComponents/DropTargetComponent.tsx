import React, { useState } from "react";
import { WidgetProps } from "../widgets/BaseWidget";
import { OccupiedSpace } from "../widgets/ContainerWidget";
import { WidgetConfigProps } from "../reducers/entityReducers/widgetConfigReducer";
import { useDrop, XYCoord } from "react-dnd";
import { ContainerProps } from "./ContainerComponent";
import WidgetFactory from "../utils/WidgetFactory";

import { widgetOperationParams, noCollision } from "../utils/WidgetPropsUtils";
import DragLayerComponent from "./DragLayerComponent";
import DropTargetMask from "./DropTargetMask";

/*TODO:
  - Try to keep only component props, state and drop hook here - DONE
  - Move all child components to their own file - DONE
  - Provide Draglayer with the actual component size if exists
    - else pull it from widgetConfig - DONE
  - Provide Draglayer with rows, columns, rowHeight, columnWidth instead of width height  pixels - DONE
  - Return rows and columns to the drop handler (updateWidget) - DONE
  - Update WidgetOperations to handle rows and columns - DONE
  - Increase default canvas rowHeight
  - Fix child container positioning
  - Fix dropping into another component issue
  
*/

type DropTargetComponentProps = ContainerProps & {
  updateWidget?: Function;
  snapColumns?: number;
  snapRows?: number;
  snapColumnSpace: number;
  snapRowSpace: number;
  occupiedSpaces: OccupiedSpace[] | null;
};

type DropTargetBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DropTargetComponent = (props: DropTargetComponentProps) => {
  // Hook to keep the offset of the drop target container in state
  const [dropTargetOffset, setDropTargetOffset] = useState({ x: 0, y: 0 });

  // Make this component a drop target
  const [{ isOver }, drop] = useDrop({
    accept: Object.values(WidgetFactory.getWidgetTypes()),
    drop(widget: WidgetProps & Partial<WidgetConfigProps>, monitor) {
      // Make sure we're dropping in this container.
      if (isOver && monitor.canDrop()) {
        props.updateWidget &&
          props.updateWidget(
            ...widgetOperationParams(
              widget,
              monitor.getClientOffset() as XYCoord,
              dropTargetOffset,
              props.snapColumnSpace,
              props.snapRowSpace,
              props.widgetId,
            ),
          );
      }
      return undefined;
    },
    // Collect isOver for ui transforms when hovering over this component
    collect: monitor => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
    // Only allow drop if the drag object is directly over this component
    // As opposed to the drag object being over a child component, or outside the component bounds
    // Also only if the dropzone does not overlap any existing children
    canDrop: (widget, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        return noCollision(
          monitor.getClientOffset() as XYCoord,
          props.snapColumnSpace,
          props.snapRowSpace,
          widget,
          dropTargetOffset,
          props.occupiedSpaces,
        );
      }
      return false;
    },
  });

  const handleBoundsUpdate = (rect: DOMRect) => {
    if (rect.x !== dropTargetOffset.x || rect.y !== dropTargetOffset.y) {
      setDropTargetOffset({
        x: rect.x,
        y: rect.y,
      });
    }
  };

  return (
    <div
      ref={drop}
      style={{
        position: "relative",
        left: props.style.xPosition + props.style.xPositionUnit,
        height: props.style.componentHeight,
        width: props.style.componentWidth,
        top: props.style.yPosition + props.style.yPositionUnit,
      }}
    >
      <DropTargetMask
        rowHeight={props.snapRowSpace}
        columnWidth={props.snapColumnSpace}
        setBounds={handleBoundsUpdate}
      />
      <DragLayerComponent
        parentOffset={dropTargetOffset}
        parentRowHeight={props.snapRowSpace}
        parentColumnWidth={props.snapColumnSpace}
        visible={isOver}
        dropTargetOffset={dropTargetOffset}
        occupiedSpaces={props.occupiedSpaces}
      />
      {props.children}
    </div>
  );
};

export default DropTargetComponent;

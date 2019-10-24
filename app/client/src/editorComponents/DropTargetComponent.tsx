import React, { useState, useContext, createContext, Context } from "react";
import { WidgetProps } from "../widgets/BaseWidget";
import { OccupiedSpaceContext } from "../widgets/ContainerWidget";
import { WidgetConfigProps } from "../reducers/entityReducers/widgetConfigReducer";
import { useDrop, XYCoord } from "react-dnd";
import { ContainerProps } from "./ContainerComponent";
import WidgetFactory from "../utils/WidgetFactory";
import { widgetOperationParams, noCollision } from "../utils/WidgetPropsUtils";
import DragLayerComponent from "./DragLayerComponent";
import { WidgetFunctionsContext } from "../pages/Editor/WidgetsEditor";
import { FocusContext } from "../pages/Editor/Canvas";

type DropTargetComponentProps = ContainerProps & {
  updateWidget?: Function;
  snapColumns?: number;
  snapRows?: number;
  snapColumnSpace: number;
  snapRowSpace: number;
};

type DropTargetBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const ResizingContext: Context<{
  isResizing?: boolean | string;
  setIsResizing?: Function;
}> = createContext({});

export const DropTargetComponent = (props: DropTargetComponentProps) => {
  // Hook to keep the offset of the drop target container in state
  const [dropTargetOffset, setDropTargetOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const { updateWidget } = useContext(WidgetFunctionsContext);
  const occupiedSpaces = useContext(OccupiedSpaceContext);
  const { setFocus, showPropertyPane } = useContext(FocusContext);
  // Make this component a drop target
  const [{ isOver, isExactlyOver }, drop] = useDrop({
    accept: Object.values(WidgetFactory.getWidgetTypes()),
    drop(widget: WidgetProps & Partial<WidgetConfigProps>, monitor) {
      // Make sure we're dropping in this container.
      if (isOver) {
        updateWidget &&
          updateWidget(
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
      isOver:
        (monitor.isOver({ shallow: true }) &&
          props.widgetId !== monitor.getItem().widgetId) ||
        (monitor.isOver() && props.widgetId !== monitor.getItem().widgetId),
      isExactlyOver: monitor.isOver({ shallow: true }),
    }),
    // Only allow drop if the drag object is directly over this component
    // As opposed to the drag object being over a child component, or outside the component bounds
    // Also only if the dropzone does not overlap any existing children
    canDrop: (widget, monitor) => {
      // Check if the draggable is the same as the dropTarget
      if (isOver) {
        return noCollision(
          monitor.getClientOffset() as XYCoord,
          props.snapColumnSpace,
          props.snapRowSpace,
          widget,
          dropTargetOffset,
          occupiedSpaces,
          props.snapRows,
          props.snapColumns,
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

  const handleFocus = () => {
    if (props.isRoot) {
      setFocus && setFocus(props.widgetId);
      showPropertyPane && showPropertyPane();
    }
  };

  return (
    <ResizingContext.Provider value={{ isResizing, setIsResizing }}>
      <div
        onClick={handleFocus}
        ref={drop}
        style={{
          position: "relative",
          left: 0,
          height: props.isRoot
            ? props.style.componentHeight + (props.style.heightUnit || "px")
            : "100%",
          width: props.isRoot
            ? props.style.componentWidth + (props.style.widthUnit || "px")
            : "100%",
          top: 0,
          userSelect: "none",
        }}
      >
        {props.children}
        <DragLayerComponent
          parentOffset={dropTargetOffset}
          parentRowHeight={props.snapRowSpace}
          parentColumnWidth={props.snapColumnSpace}
          visible={isOver || isResizing}
          isOver={isExactlyOver}
          dropTargetOffset={dropTargetOffset}
          occupiedSpaces={occupiedSpaces}
          onBoundsUpdate={handleBoundsUpdate}
          parentRows={props.snapRows}
          parentCols={props.snapColumns}
          isResizing={isResizing}
        />
      </div>
    </ResizingContext.Provider>
  );
};

export default DropTargetComponent;

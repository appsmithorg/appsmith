import React, { useState, useContext, ReactNode } from "react";
import { useDrop, XYCoord, DropTargetMonitor } from "react-dnd";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import WidgetFactory from "utils/WidgetFactory";
import { widgetOperationParams, noCollision } from "utils/WidgetPropsUtils";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { FocusContext, ResizingContext } from "pages/Editor/CanvasContexts";

import DragLayerComponent from "./DragLayerComponent";

type DropTargetComponentProps = WidgetProps & {
  children?: ReactNode;
  snapColumnSpace: number;
  snapRowSpace: number;
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
  const { updateWidget, occupiedSpaces } = useContext(EditorContext);
  const { selectWidget, showPropertyPane } = useContext(FocusContext);
  const { isResizing } = useContext(ResizingContext);
  const spacesOccupiedBySiblingWidgets =
    occupiedSpaces && occupiedSpaces[props.widgetId]
      ? occupiedSpaces[props.widgetId]
      : undefined;
  // Make this component a drop target
  const [{ isOver, isExactlyOver }, drop] = useDrop({
    accept: Object.values(WidgetFactory.getWidgetTypes()),
    drop(widget: WidgetProps & Partial<WidgetConfigProps>, monitor) {
      // Make sure we're dropping in this container.
      if (isExactlyOver) {
        const updateWidgetParams = widgetOperationParams(
          widget,
          monitor.getSourceClientOffset() as XYCoord,
          dropTargetOffset,
          props.snapColumnSpace,
          props.snapRowSpace,
          props.widgetId,
        );
        // Only show propertypane if this is a new widget.
        // If it is not a new widget, then let the DraggableComponent handle it.
        showPropertyPane &&
          updateWidgetParams.payload.newWidgetId &&
          showPropertyPane(updateWidgetParams.payload.newWidgetId);

        updateWidget &&
          updateWidget(
            updateWidgetParams.operation,
            updateWidgetParams.widgetId,
            updateWidgetParams.payload,
          );
      }
      return undefined;
    },
    // Collect isOver for ui transforms when hovering over this component
    collect: (monitor: DropTargetMonitor) => ({
      isOver:
        (monitor.isOver({ shallow: true }) &&
          props.widgetId !== monitor.getItem().widgetId) ||
        (monitor.isOver() && props.widgetId !== monitor.getItem().widgetId),
      isExactlyOver: monitor.isOver({ shallow: true }),
      draggingItem: monitor.getItem() as WidgetProps,
    }),
    // Only allow drop if the drag object is directly over this component
    // As opposed to the drag object being over a child component, or outside the component bounds
    // Also only if the dropzone does not overlap any existing children
    canDrop: (widget, monitor) => {
      // Check if the draggable is the same as the dropTarget
      if (isExactlyOver) {
        const hasCollision = !noCollision(
          monitor.getSourceClientOffset() as XYCoord,
          props.snapColumnSpace,
          props.snapRowSpace,
          widget,
          dropTargetOffset,
          spacesOccupiedBySiblingWidgets,
          props.snapRows,
          props.snapColumns,
        );
        return !hasCollision;
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
    if (!props.parentId && !isResizing) {
      selectWidget && selectWidget(props.widgetId);
      showPropertyPane && showPropertyPane();
    }
  };

  return (
    <div
      onClick={handleFocus}
      ref={drop}
      style={{
        position: "relative",
        left: 0,
        height: "100%",
        width: "100%",
        top: 0,
        userSelect: "none",
        opacity: 0.99,
      }}
    >
      {props.children}
      <DragLayerComponent
        parentOffset={dropTargetOffset}
        parentRowHeight={props.snapRowSpace}
        parentColumnWidth={props.snapColumnSpace}
        visible={isOver || !!isResizing}
        isOver={isExactlyOver}
        dropTargetOffset={dropTargetOffset}
        occupiedSpaces={spacesOccupiedBySiblingWidgets}
        onBoundsUpdate={handleBoundsUpdate}
        parentRows={props.snapRows}
        parentCols={props.snapColumns}
        isResizing={isResizing}
      />
    </div>
  );
};

export default DropTargetComponent;

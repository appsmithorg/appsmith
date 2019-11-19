import React, {
  useState,
  useContext,
  createContext,
  Context,
  ReactNode,
} from "react";
import { useDrop, XYCoord, DropTargetMonitor } from "react-dnd";

import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import WidgetFactory from "utils/WidgetFactory";
import { widgetOperationParams, noCollision } from "utils/WidgetPropsUtils";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { FocusContext } from "pages/Editor/Canvas";

import DragLayerComponent from "./DragLayerComponent";

/*
TODO(abhinav):
  1) Drag collision is not working
  2) Dragging into a new container does not work
*/

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

export const ResizingContext: Context<{
  isResizing?: boolean | string;
  setIsResizing?: Function;
}> = createContext({});

export const DropTargetComponent = (props: DropTargetComponentProps) => {
  // Hook to keep the offset of the drop target container in state
  const [dropTargetOffset, setDropTargetOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const { updateWidget, occupiedSpaces } = useContext(EditorContext);
  const { setFocus, showPropertyPane } = useContext(FocusContext);
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
          monitor.getClientOffset() as XYCoord,
          dropTargetOffset,
          props.snapColumnSpace,
          props.snapRowSpace,
          props.widgetId,
        );

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
          monitor.getClientOffset() as XYCoord,
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
    if (!props.parentId) {
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
          visible={isOver || isResizing}
          isOver={isExactlyOver}
          dropTargetOffset={dropTargetOffset}
          occupiedSpaces={spacesOccupiedBySiblingWidgets}
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

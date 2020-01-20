import React, {
  useState,
  useContext,
  ReactNode,
  Context,
  createContext,
  useEffect,
} from "react";
import styled from "styled-components";
import { useDrop, XYCoord, DropTargetMonitor } from "react-dnd";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import WidgetFactory from "utils/WidgetFactory";
import { widgetOperationParams, noCollision } from "utils/WidgetPropsUtils";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import {
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { calculateDropTargetRows } from "./DropTargetUtils";
import DragLayerComponent from "./DragLayerComponent";
import { AppState } from "reducers";
import { useSelector } from "react-redux";
import { theme } from "constants/DefaultTheme";
import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";

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

const StyledDropTarget = styled.div`
  transition: height 100ms ease-in;
`;

/* 
  This context will provide the function which will help the draglayer and resizablecomponents trigger
  an update of the main container's rows
*/
export const DropTargetContext: Context<{
  updateDropTargetRows?: (row: number) => boolean;
  persistDropTargetRows?: (widgetId: string, rows: number) => void;
}> = createContext({});

export const DropTargetComponent = (props: DropTargetComponentProps) => {
  // Hook to keep the offset of the drop target container in state
  const [dropTargetOffset, setDropTargetOffset] = useState({ x: 0, y: 0 });
  const showPropertyPane = useShowPropertyPane();
  const { selectWidget } = useWidgetSelection();

  const [rows, setRows] = useState(props.snapRows);
  useEffect(() => {
    setRows(props.snapRows);
  }, [props.snapRows]);
  const { updateWidget, occupiedSpaces, updateWidgetProperty } = useContext(
    EditorContext,
  );

  const selectedWidget = useSelector(
    (state: AppState) => state.ui.editor.selectedWidget,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  const spacesOccupiedBySiblingWidgets =
    occupiedSpaces && occupiedSpaces[props.widgetId]
      ? occupiedSpaces[props.widgetId]
      : undefined;

  const childWidgets = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId].children,
  );

  const persistDropTargetRows = (widgetId: string, widgetBottomRow: number) => {
    if (props.widgetId === MAIN_CONTAINER_WIDGET_ID) {
      const occupiedSpacesByChildren =
        occupiedSpaces && occupiedSpaces[MAIN_CONTAINER_WIDGET_ID];

      const rowsToPersist = calculateDropTargetRows(
        widgetId,
        widgetBottomRow,
        rows,
        occupiedSpacesByChildren,
      );
      setRows(rowsToPersist);

      /* Update the main container's rows, ONLY if it has changed since the last render */
      if (props.snapRows !== rowsToPersist) {
        updateWidgetProperty &&
          updateWidgetProperty(props.widgetId, "snapRows", rowsToPersist);
        updateWidgetProperty &&
          updateWidgetProperty(
            props.widgetId,
            "bottomRow",
            Math.round(
              (rowsToPersist * props.snapRowSpace) / props.parentRowSpace,
            ),
          );
      }
    }
  };

  /* Update the rows of the main container based on the current widget's (dragging/resizing) bottom row */
  const updateDropTargetRows = (widgetBottomRow: number) => {
    if (props.widgetId === MAIN_CONTAINER_WIDGET_ID) {
      /* If the widget has reached the penultimate row of the main container */
      if (widgetBottomRow > rows - 1) {
        setRows(rows + 2);
        return true;
        // If the current widget's (dragging/resizing) bottom row has moved back up
      } else if (widgetBottomRow < rows - 2 && rows - props.snapRows >= 2) {
        setRows(rows - 2);
        return true;
      }
      return false;
    }

    return false;
  };

  const isChildFocused =
    !!childWidgets &&
    !!selectedWidget &&
    childWidgets.length > 0 &&
    childWidgets.indexOf(selectedWidget) > -1;

  const isChildResizing = !!isResizing && isChildFocused;
  // Make this component a drop target
  const [{ isExactlyOver }, drop] = useDrop({
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

        // Select the widget if it is a new widget
        selectWidget &&
          updateWidgetParams.payload.newWidgetId &&
          selectWidget(updateWidgetParams.payload.newWidgetId);

        /* currently dropped widget's bottom row */
        const droppedWidgetBottomRow = updateWidgetParams.payload.rows
          ? updateWidgetParams.payload.topRow + updateWidgetParams.payload.rows
          : updateWidgetParams.payload.topRow +
            (widget.bottomRow - widget.topRow);

        persistDropTargetRows(
          widget.widgetId || updateWidgetParams.payload.newWidgetId,
          droppedWidgetBottomRow,
        );

        /* Finally update the widget */
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
          rows,
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

  const width =
    props.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? `calc(100% - ${WIDGET_PADDING * 2}px)`
      : "100%";

  const height =
    props.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? `${rows * props.snapRowSpace}px`
      : "100%";

  const marginTop =
    props.widgetId === MAIN_CONTAINER_WIDGET_ID ? `${theme.spaces[9]}px` : 0;
  const marginBottom =
    props.widgetId === MAIN_CONTAINER_WIDGET_ID ? "500px" : 0;

  return (
    <DropTargetContext.Provider
      value={{ updateDropTargetRows, persistDropTargetRows }}
    >
      <StyledDropTarget
        onClick={handleFocus}
        ref={drop}
        style={{
          position: "relative",
          width,
          height,
          marginTop,
          marginBottom,
          userSelect: "none",
          opacity: 0.99,
        }}
      >
        {props.children}
        <DragLayerComponent
          parentOffset={dropTargetOffset}
          parentWidgetId={props.widgetId}
          parentRowHeight={props.snapRowSpace}
          parentColumnWidth={props.snapColumnSpace}
          visible={isExactlyOver || isChildResizing}
          isOver={isExactlyOver}
          dropTargetOffset={dropTargetOffset}
          occupiedSpaces={spacesOccupiedBySiblingWidgets}
          onBoundsUpdate={handleBoundsUpdate}
          parentRows={rows}
          parentCols={props.snapColumns}
          isResizing={isChildResizing}
        />
      </StyledDropTarget>
    </DropTargetContext.Provider>
  );
};

export default DropTargetComponent;

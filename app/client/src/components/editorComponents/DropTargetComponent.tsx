import React, {
  useState,
  useContext,
  ReactNode,
  Context,
  createContext,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import styled from "styled-components";
import { useDrop, XYCoord, DropTargetMonitor } from "react-dnd";
import { isEqual } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  widgetOperationParams,
  noCollision,
  getCanvasSnapRows,
} from "utils/WidgetPropsUtils";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import {
  MAIN_CONTAINER_WIDGET_ID,
  GridDefaults,
  WidgetTypes,
} from "constants/WidgetConstants";
import { calculateDropTargetRows } from "./DropTargetUtils";
import DragLayerComponent from "./DragLayerComponent";
import { AppState } from "reducers";
import { useSelector } from "react-redux";
import {
  useShowPropertyPane,
  useCanvasSnapRowsUpdateHook,
} from "utils/hooks/dragResizeHooks";
import { getOccupiedSpacesSelectorForContainer } from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { OccupiedSpace } from "constants/editorConstants";

type DropTargetComponentProps = WidgetProps & {
  children?: ReactNode;
  snapColumnSpace: number;
  snapRowSpace: number;
  minHeight: number;
  noPad?: boolean;
};

const StyledDropTarget = styled.div`
  transition: height 100ms ease-in;
  width: 100%;
  position: relative;
  background: none;
  user-select: none;
`;

function Onboarding() {
  return (
    <div style={{ position: "fixed", left: "50%", top: "50vh" }}>
      <h2 style={{ color: "#ccc" }}>Drag and drop a widget here</h2>
    </div>
  );
}

/*
  This context will provide the function which will help the draglayer and resizablecomponents trigger
  an update of the main container's rows
*/
export const DropTargetContext: Context<{
  updateDropTargetRows?: (widgetId: string, row: number) => boolean;
  persistDropTargetRows?: (widgetId: string, row: number) => void;
  occupiedSpaces?: OccupiedSpace[];
}> = createContext({});

export function DropTargetComponent(props: DropTargetComponentProps) {
  const canDropTargetExtend = props.canExtend;

  const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);

  const { updateWidget } = useContext(EditorContext);
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const childWidgets = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId].children,
  );

  const selectOccupiedSpaces = useCallback(
    getOccupiedSpacesSelectorForContainer(props.widgetId),
    [props.widgetId],
  );

  const occupiedSpacesByChildren = useSelector(selectOccupiedSpaces, isEqual);

  const [dropTargetOffset, setDropTargetOffset] = useState({ x: 0, y: 0 });
  const [rows, setRows] = useState(snapRows);

  const showPropertyPane = useShowPropertyPane();
  const { deselectAll, focusWidget, selectWidget } = useWidgetSelection();
  const updateCanvasSnapRows = useCanvasSnapRowsUpdateHook();

  useEffect(() => {
    const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);
    setRows(snapRows);
  }, [props.bottomRow, props.canExtend]);

  const persistDropTargetRows = useCallback(
    (widgetId: string, widgetBottomRow: number) => {
      const newRows = calculateDropTargetRows(
        widgetId,
        widgetBottomRow,
        props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
        occupiedSpacesByChildren,
      );
      const rowsToPersist = Math.max(
        props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
        newRows,
      );
      setRows(rowsToPersist);
      if (canDropTargetExtend) {
        updateCanvasSnapRows(props.widgetId, rowsToPersist);
      }
    },
    [
      props.minHeight,
      props.widgetId,
      occupiedSpacesByChildren,
      canDropTargetExtend,
    ],
  );

  /* Update the rows of the main container based on the current widget's (dragging/resizing) bottom row */
  const updateDropTargetRows = useCallback(
    (widgetId: string, widgetBottomRow: number) => {
      if (canDropTargetExtend) {
        const newRows = calculateDropTargetRows(
          widgetId,
          widgetBottomRow,
          props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
          occupiedSpacesByChildren,
        );
        if (rows < newRows) {
          setRows(newRows);
          return true;
        }
        return false;
      }
      return false;
    },
    [props.minHeight, occupiedSpacesByChildren, canDropTargetExtend, rows],
  );

  const isChildFocused =
    !!childWidgets &&
    !!selectedWidget &&
    childWidgets.length > 0 &&
    childWidgets.indexOf(selectedWidget) > -1;

  const isChildResizing = !!isResizing && isChildFocused;
  // Make this component a drop target
  const [{ isExactlyOver, isOver }, drop] = useDrop({
    accept: Object.values(WidgetTypes),
    options: {
      arePropsEqual: () => {
        return true;
      },
    },
    drop(widget: WidgetProps & Partial<WidgetConfigProps>, monitor) {
      // Make sure we're dropping in this container.
      if (isExactlyOver) {
        const updateWidgetParams = widgetOperationParams(
          widget,
          monitor.getSourceClientOffset() as XYCoord,
          dropTargetOffset,
          props.snapColumnSpace,
          props.snapRowSpace,
          widget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : props.widgetId,
        );

        // const widgetBottomRow = getWidgetBottomRow(widget, updateWidgetParams);
        const widgetBottomRow =
          updateWidgetParams.payload.topRow +
          (updateWidgetParams.payload.rows || widget.bottomRow - widget.topRow);

        // Only show propertypane if this is a new widget.
        // If it is not a new widget, then let the DraggableComponent handle it.
        // Give evaluations a second to complete.

        // Select the widget if it is a new widget
        selectWidget && selectWidget(widget.widgetId);
        persistDropTargetRows(widget.widgetId, widgetBottomRow);
        if (updateWidgetParams.payload.newWidgetId) {
          setTimeout(() => {
            showPropertyPane(updateWidgetParams.payload.newWidgetId);
            // toggleEditWidgetName(updateWidgetParams.payload.newWidgetId, true);
          }, 100);
        } else {
          showPropertyPane();
        }

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
      isExactlyOver: monitor.isOver({ shallow: true }),
      isOver: monitor.isOver(),
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
          occupiedSpacesByChildren,
          rows,
          GridDefaults.DEFAULT_GRID_COLUMNS,
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

  const handleFocus = (e: any) => {
    if (!isResizing && !isDragging) {
      if (!props.parentId) {
        deselectAll();
        focusWidget && focusWidget(props.widgetId);
        showPropertyPane && showPropertyPane();
      }
    }
    // commenting this out to allow propagation of click events
    // e.stopPropagation();
    e.preventDefault();
  };
  const height = canDropTargetExtend
    ? `${Math.max(rows * props.snapRowSpace, props.minHeight)}px`
    : "100%";

  const boxShadow =
    (isResizing || isDragging) &&
    isExactlyOver &&
    props.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? "0px 0px 0px 1px #DDDDDD"
      : "0px 0px 0px 1px transparent";
  const dropRef = !props.dropDisabled ? drop : undefined;

  // memoizing context values
  const contextValue = useMemo(() => {
    return {
      updateDropTargetRows,
      persistDropTargetRows,
      occupiedSpaces: occupiedSpacesByChildren,
    };
  }, [updateDropTargetRows, persistDropTargetRows, occupiedSpacesByChildren]);

  return (
    <DropTargetContext.Provider value={contextValue}>
      <StyledDropTarget
        className={"t--drop-target"}
        onClick={handleFocus}
        ref={dropRef}
        style={{
          height,
          boxShadow,
        }}
      >
        {props.children}
        {!(childWidgets && childWidgets.length) &&
          !isDragging &&
          !props.parentId && <Onboarding />}
        <DragLayerComponent
          canDropTargetExtend={canDropTargetExtend}
          force={isDragging && !isOver && !props.parentId}
          isOver={isExactlyOver}
          isResizing={isChildResizing}
          noPad={props.noPad || false}
          occupiedSpaces={occupiedSpacesByChildren}
          onBoundsUpdate={handleBoundsUpdate}
          parentCols={props.snapColumns}
          parentColumnWidth={props.snapColumnSpace}
          parentRowHeight={props.snapRowSpace}
          parentRows={rows}
          parentWidgetId={props.widgetId}
          visible={isExactlyOver || isChildResizing}
        />
      </StyledDropTarget>
    </DropTargetContext.Provider>
  );
}

const MemoizedDropTargetComponent = memo(DropTargetComponent);

export default MemoizedDropTargetComponent;

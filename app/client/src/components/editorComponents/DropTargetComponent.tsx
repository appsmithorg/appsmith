import React, {
  useState,
  ReactNode,
  Context,
  createContext,
  useEffect,
  memo,
  useMemo,
} from "react";
import styled, { CSSProperties } from "styled-components";
import { useDrop, XYCoord, DropTargetMonitor } from "react-dnd";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  widgetOperationParams,
  noCollision,
  getCanvasSnapRows,
} from "utils/WidgetPropsUtils";
import {
  MAIN_CONTAINER_WIDGET_ID,
  GridDefaults,
} from "constants/WidgetConstants";
import { calculateDropTargetRows } from "./DropTargetUtils";
import DragLayerComponent from "./DragLayerComponent";
import { AppState } from "reducers";
import { useDispatch, useSelector } from "react-redux";
import {
  useShowPropertyPane,
  useCanvasSnapRowsUpdateHook,
} from "utils/hooks/dragResizeHooks";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import WidgetFactory from "utils/WidgetFactory";
import { getSnapSpaces } from "widgets/WidgetUtils";
const WidgetTypes = WidgetFactory.widgetTypes;
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { updateWidget } from "actions/pageActions";

type DropTargetComponentProps = WidgetProps & {
  children?: ReactNode;
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

const StyledOnboardingWrapper = styled.div`
  position: fixed;
  left: 50%;
  top: 50vh;
`;
const StyledOnboardingMessage = styled.h2`
  color: #ccc;
`;

function Onboarding() {
  return (
    <StyledOnboardingWrapper>
      <StyledOnboardingMessage>
        Drag and drop a widget here
      </StyledOnboardingMessage>
    </StyledOnboardingWrapper>
  );
}

/*
  This context will provide the function which will help the draglayer and resizablecomponents trigger
  an update of the main container's rows
*/
export const DropTargetContext: Context<{
  updateDropTargetRows?: (widgetId: string, row: number) => boolean;
  persistDropTargetRows?: (widgetId: string, row: number) => void;
}> = createContext({});

export function DropTargetComponent(props: DropTargetComponentProps) {
  console.log("Connected Widgets DropTarget", { props });
  const { snapColumnSpace, snapRowSpace } = getSnapSpaces(props);
  const canDropTargetExtend = props.canExtend;
  const dispatch = useDispatch();
  const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);

  const occupiedSpaces = useSelector(getOccupiedSpaces);
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const spacesOccupiedBySiblingWidgets =
    occupiedSpaces && occupiedSpaces[props.widgetId]
      ? occupiedSpaces[props.widgetId]
      : undefined;

  const childWidgets = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId].children,
  );

  const occupiedSpacesByChildren =
    occupiedSpaces && occupiedSpaces[props.widgetId];

  const [dropTargetOffset, setDropTargetOffset] = useState({ x: 0, y: 0 });
  const [rows, setRows] = useState(snapRows);

  const showPropertyPane = useShowPropertyPane();
  const { deselectAll, focusWidget, selectWidget } = useWidgetSelection();
  const updateCanvasSnapRows = useCanvasSnapRowsUpdateHook();

  useEffect(() => {
    const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);
    setRows(snapRows);
  }, [props.bottomRow, props.canExtend]);

  const persistDropTargetRows = (widgetId: string, widgetBottomRow: number) => {
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
  };

  /* Update the rows of the main container based on the current widget's (dragging/resizing) bottom row */
  const updateDropTargetRows = (widgetId: string, widgetBottomRow: number) => {
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
  };

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
      const start = performance.now();
      // Make sure we're dropping in this container.
      if (isExactlyOver) {
        const canDrop = noCollision(
          monitor.getSourceClientOffset() as XYCoord,
          snapColumnSpace,
          snapRowSpace,
          widget,
          dropTargetOffset,
          spacesOccupiedBySiblingWidgets,
          rows,
          GridDefaults.DEFAULT_GRID_COLUMNS,
        );
        console.log("Connected ============", { canDrop });
        if (canDrop) {
          const updateWidgetParams = widgetOperationParams(
            widget,
            monitor.getSourceClientOffset() as XYCoord,
            dropTargetOffset,
            snapColumnSpace,
            snapRowSpace,
            widget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : props.widgetId,
          );
          console.log(
            "Drop: Widget operation params",
            performance.now() - start,
            "ms",
          );

          // const widgetBottomRow = getWidgetBottomRow(widget, updateWidgetParams);
          const widgetBottomRow =
            updateWidgetParams.payload.topRow +
            (updateWidgetParams.payload.rows ||
              widget.bottomRow - widget.topRow);

          console.log(
            "Drop: Widget bottom row",
            performance.now() - start,
            "ms",
          );
          // Only show propertypane if this is a new widget.
          // If it is not a new widget, then let the DraggableComponent handle it.
          // Give evaluations a second to complete.
          setTimeout(() => {
            if (showPropertyPane && updateWidgetParams.payload.newWidgetId) {
              showPropertyPane(updateWidgetParams.payload.newWidgetId);
              // toggleEditWidgetName(updateWidgetParams.payload.newWidgetId, true);
            }
          }, 100);

          // Select the widget if it is a new widget
          selectWidget && selectWidget(widget.widgetId);
          persistDropTargetRows(widget.widgetId, widgetBottomRow);

          console.log(
            "Drop: select and persist",
            performance.now() - start,
            "ms",
          );
          /* Finally update the widget */
          dispatch(
            updateWidget(
              updateWidgetParams.operation,
              updateWidgetParams.widgetId,
              updateWidgetParams.payload,
            ),
          );
          console.log("Drop: update widget", performance.now() - start, "ms");
        }
      }
      console.log("Drop calculations took:", performance.now() - start, "ms");
      return undefined;
    },
    // Collect isOver for ui transforms when hovering over this component
    collect: (monitor: DropTargetMonitor) => ({
      isExactlyOver: monitor.isOver({ shallow: true }),
      isOver: monitor.isOver(),
    }),
    // // Only allow drop if the drag object is directly over this component
    // // As opposed to the drag object being over a child component, or outside the component bounds
    // // Also only if the dropzone does not overlap any existing children
    // canDrop: (widget, monitor) => {
    //   // Check if the draggable is the same as the dropTarget
    //   if (isExactlyOver) {
    //     const hasCollision = !noCollision(
    //       monitor.getSourceClientOffset() as XYCoord,
    //       snapColumnSpace,
    //       snapRowSpace,
    //       widget,
    //       dropTargetOffset,
    //       spacesOccupiedBySiblingWidgets,
    //       rows,
    //       GridDefaults.DEFAULT_GRID_COLUMNS,
    //     );
    //     return !hasCollision;
    //   }
    //   return false;
    // },
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
    if (!isResizing && !isDragging && !props.parentId) {
      deselectAll();
      focusWidget && focusWidget(props.widgetId);
      showPropertyPane && showPropertyPane();
    }
    // commenting this out to allow propagation of click events
    // e.stopPropagation();
    e.preventDefault();
  };

  const styles: CSSProperties = useMemo(() => {
    return {
      height: canDropTargetExtend
        ? `${Math.max(rows * snapRowSpace, props.minHeight)}px`
        : "100%",
      boxShadow:
        (isResizing || isDragging) &&
        isExactlyOver &&
        props.widgetId === MAIN_CONTAINER_WIDGET_ID
          ? "0px 0px 0px 1px #DDDDDD"
          : "0px 0px 0px 1px transparent",
    };
  }, [props.widgetId, props.minHeight, isResizing, isDragging]);

  const dropRef = !props.dropDisabled ? drop : undefined;

  return (
    <DropTargetContext.Provider
      value={{ updateDropTargetRows, persistDropTargetRows }}
    >
      <StyledDropTarget
        className={"t--drop-target"}
        onClick={handleFocus}
        ref={dropRef}
        style={styles}
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
          occupiedSpaces={spacesOccupiedBySiblingWidgets}
          onBoundsUpdate={handleBoundsUpdate}
          parentCols={props.snapColumns}
          parentColumnWidth={snapColumnSpace}
          parentRowHeight={snapRowSpace}
          parentRows={rows}
          parentWidgetId={props.widgetId}
          visible={isExactlyOver || isChildResizing}
        />
      </StyledDropTarget>
    </DropTargetContext.Provider>
  );
}
(DropTargetComponent as any).whyDidYouRender = {
  logOnDifferentValues: true,
};

const MemoizedDropTargetComponent = memo(DropTargetComponent);

export default MemoizedDropTargetComponent;

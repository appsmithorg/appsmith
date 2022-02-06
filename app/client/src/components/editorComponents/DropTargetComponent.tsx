import React, {
  ReactNode,
  Context,
  createContext,
  memo,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import styled from "styled-components";
import { isEqual } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import {
  MAIN_CONTAINER_WIDGET_ID,
  GridDefaults,
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
import { getDragDetails } from "sagas/selectors";

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
  z-index: 1;
`;

function Onboarding() {
  return (
    <h2 className="absolute top-0 left-0 right-0 flex items-end h-108 justify-center text-2xl font-bold text-gray-300">
      Drag and drop a widget here
    </h2>
  );
}

/*
  This context will provide the function which will help the draglayer and resizablecomponents trigger
  an update of the main container's rows
*/
export const DropTargetContext: Context<{
  updateDropTargetRows?: (
    widgetIdsToExclude: string[],
    widgetBottomRow: number,
  ) => number | false;
}> = createContext({});

export function DropTargetComponent(props: DropTargetComponentProps) {
  const canDropTargetExtend = props.canExtend;
  const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails = useSelector(getDragDetails);

  const { draggedOn } = dragDetails;

  const childWidgets: string[] | undefined = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId]?.children,
  );

  const selectOccupiedSpaces = useCallback(
    getOccupiedSpacesSelectorForContainer(props.widgetId),
    [props.widgetId],
  );

  const occupiedSpacesByChildren = useSelector(selectOccupiedSpaces, isEqual);

  const rowRef = useRef(snapRows);

  const showPropertyPane = useShowPropertyPane();
  const { deselectAll, focusWidget } = useWidgetSelection();
  const updateCanvasSnapRows = useCanvasSnapRowsUpdateHook();
  const showDragLayer =
    (isDragging && draggedOn === props.widgetId) || isResizing;

  useEffect(() => {
    const snapRows = getCanvasSnapRows(props.bottomRow, props.canExtend);
    if (rowRef.current !== snapRows) {
      rowRef.current = snapRows;
      updateHeight();
      if (canDropTargetExtend) {
        updateCanvasSnapRows(props.widgetId, snapRows);
      }
    }
  }, [props.bottomRow, props.canExtend]);
  useEffect(() => {
    if (!isDragging || !isResizing) {
      // bottom row of canvas can increase by any number as user moves/resizes any widget towards the bottom of the canvas
      // but canvas height is not lost when user moves/resizes back top.
      // it is done that way to have a pleasant building experience.
      // post drop the bottom most row is used to appropriately calculate the canvas height and lose unwanted height.
      rowRef.current = snapRows;
      updateHeight();
    }
  }, [isDragging, isResizing]);

  const updateHeight = () => {
    if (dropTargetRef.current) {
      const height = canDropTargetExtend
        ? `${Math.max(rowRef.current * props.snapRowSpace, props.minHeight)}px`
        : "100%";
      dropTargetRef.current.style.height = height;
    }
  };
  const updateDropTargetRows = (
    widgetIdsToExclude: string[],
    widgetBottomRow: number,
  ) => {
    if (canDropTargetExtend) {
      const newRows = calculateDropTargetRows(
        widgetIdsToExclude,
        widgetBottomRow,
        props.minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
        occupiedSpacesByChildren,
      );
      if (rowRef.current < newRows) {
        rowRef.current = newRows;
        updateHeight();
        return newRows;
      }
      return false;
    }
    return false;
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
    ? `${Math.max(rowRef.current * props.snapRowSpace, props.minHeight)}px`
    : "100%";
  const boxShadow =
    (isResizing || isDragging) && props.widgetId === MAIN_CONTAINER_WIDGET_ID
      ? "inset 0px 0px 0px 1px #DDDDDD"
      : "0px 0px 0px 1px transparent";
  const dropTargetRef = useRef<HTMLDivElement>(null);

  // memoizing context values
  const contextValue = useMemo(() => {
    return {
      updateDropTargetRows,
    };
  }, [updateDropTargetRows, occupiedSpacesByChildren]);
  return (
    <DropTargetContext.Provider value={contextValue}>
      <StyledDropTarget
        className="t--drop-target"
        onClick={handleFocus}
        ref={dropTargetRef}
        style={{
          height,
          boxShadow,
        }}
      >
        {props.children}
        {!(childWidgets && childWidgets.length) &&
          !isDragging &&
          !props.parentId && <Onboarding />}
        {showDragLayer && (
          <DragLayerComponent
            noPad={props.noPad || false}
            parentColumnWidth={props.snapColumnSpace}
            parentRowHeight={props.snapRowSpace}
          />
        )}
      </StyledDropTarget>
    </DropTargetContext.Provider>
  );
}

const MemoizedDropTargetComponent = memo(DropTargetComponent);

export default MemoizedDropTargetComponent;

import { useContext, useEffect, useRef } from "react";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { useSelector } from "store";
import { AppState } from "reducers";
import { getSelectedWidgets } from "selectors/ui";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import {
  getDropZoneOffsets,
  WidgetOperationParams,
  widgetOperationParams,
} from "utils/WidgetPropsUtils";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { isEmpty, isEqual } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { snapToGrid } from "utils/helpers";
import { stopReflowAction } from "actions/reflowActions";
import { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { getIsReflowing } from "selectors/widgetReflowSelectors";
import { XYCord } from "./useCanvasDragging";
import ContainerJumpMetrics from "./ContainerJumpMetric";

export interface WidgetDraggingUpdateParams extends WidgetDraggingBlock {
  updateWidgetParams: WidgetOperationParams;
}

export type WidgetDraggingBlock = {
  left: number;
  top: number;
  width: number;
  height: number;
  columnWidth: number;
  rowHeight: number;
  widgetId: string;
  isNotColliding: boolean;
  detachFromLayout?: boolean;
};

const containerJumpMetrics = new ContainerJumpMetrics<{
  speed?: number;
  acceleration?: number;
  movingInto?: string;
}>();

// This method is called on drop,
// This method logs the metrics container jump and marks it as successful container jump,
// If widget has moves into a container and drops there.
const logContainerJumpOnDrop = () => {
  const { acceleration, movingInto, speed } = containerJumpMetrics.getMetrics();
  // If it is dropped into a container after jumping, then
  if (movingInto) {
    AnalyticsUtil.logEvent("CONTAINER_JUMP", {
      speed: speed,
      acceleration: acceleration,
      isAccidental: false,
    });
  }
  containerJumpMetrics.clearMetrics();
};

export const useBlocksToBeDraggedOnCanvas = ({
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: CanvasDraggingArenaProps) => {
  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();
  const containerPadding = noPad ? 0 : CONTAINER_GRID_PADDING;
  const lastDraggedCanvas = useRef<string | undefined>(undefined);

  // check any table filter is open or not
  // if filter pane open, close before property pane open
  const tableFilterPaneState = useSelector(getTableFilterState);
  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const draggingCanvas = useSelector(
    getWidgetByID(dragDetails.draggedOn || ""),
  );
  const isReflowing = useSelector(getIsReflowing);
  useEffect(() => {
    if (
      dragDetails.draggedOn &&
      draggingCanvas &&
      draggingCanvas.parentId &&
      ![widgetId, MAIN_CONTAINER_WIDGET_ID].includes(dragDetails.draggedOn)
    ) {
      lastDraggedCanvas.current = draggingCanvas.parentId;
    }
  }, [dragDetails.draggedOn]);
  const defaultHandlePositions = {
    top: 20,
    left: 20,
  };
  const {
    draggingGroupCenter: dragCenter,
    dragGroupActualParent: dragParent,
    newWidget,
  } = dragDetails;
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const occupiedSpaces = useSelector(getOccupiedSpaces, isEqual) || {};
  const isNewWidget = !!newWidget && !dragParent;
  const childrenOccupiedSpaces: OccupiedSpace[] =
    (dragParent && occupiedSpaces[dragParent]) || [];
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const { updateWidget } = useContext(EditorContext);

  const allWidgets = useSelector(getWidgets);

  //This method is called whenever a there is a canvas change.
  //canvas is the Layer inside the widgets or on main container where widgets are positioned or dragged.
  //This method records the container jump metrics when a widget moves into a container from main Canvas,
  // if the widget moves back to the main Canvas then, it is marked as accidental container jump.
  const logContainerJump = (
    dropTargetWidgetId: string,
    dragSpeed?: number,
    dragAcceleration?: number,
  ) => {
    //If triggered on the same canvas that it started dragging on return
    if (!dragDetails.draggedOn || dropTargetWidgetId === dragDetails.draggedOn)
      return;

    const {
      acceleration,
      movingInto,
      speed,
    } = containerJumpMetrics.getMetrics();

    // record Only
    // if it was not previously recorded
    // if not moving into mainContainer
    // dragSpeed and dragAcceleration is not undefined
    if (
      !movingInto &&
      dropTargetWidgetId !== MAIN_CONTAINER_WIDGET_ID &&
      dragSpeed &&
      dragAcceleration
    ) {
      containerJumpMetrics.setMetrics({
        speed: dragSpeed,
        acceleration: dragAcceleration,
        movingInto: dropTargetWidgetId,
      });
    } // record only for mainContainer jumps,
    //If it is coming back to main canvas after moving into a container then it is a accidental container jump
    else if (movingInto && dropTargetWidgetId === MAIN_CONTAINER_WIDGET_ID) {
      AnalyticsUtil.logEvent("CONTAINER_JUMP", {
        speed: speed,
        acceleration: acceleration,
        isAccidental: true,
      });
      containerJumpMetrics.clearMetrics();
    }
  };
  const getDragCenterSpace = () => {
    if (dragCenter && dragCenter.widgetId) {
      // Dragging by widget
      return (
        childrenOccupiedSpaces.find(
          (each) => each.id === dragCenter.widgetId,
        ) || {}
      );
    } else if (
      dragCenter &&
      Number.isInteger(dragCenter.top) &&
      Number.isInteger(dragCenter.left)
    ) {
      // Dragging by Widget selection box
      return dragCenter;
    } else {
      return {};
    }
  };
  const getSnappedXY = (
    parentColumnWidth: number,
    parentRowHeight: number,
    currentOffset: XYCord,
    parentOffset: XYCord,
  ) => {
    // TODO(abhinav): There is a simpler math to use.
    const [leftColumn, topRow] = snapToGrid(
      parentColumnWidth,
      parentRowHeight,
      currentOffset.x - parentOffset.x,
      currentOffset.y - parentOffset.y,
    );
    return {
      X: leftColumn * parentColumnWidth,
      Y: topRow * parentRowHeight,
    };
  };
  const getBlocksToDraw = (): {
    blocksToDraw: WidgetDraggingBlock[];
    draggingSpaces: OccupiedSpace[];
  } => {
    if (isNewWidget) {
      return {
        blocksToDraw: [
          {
            top: 0,
            left: 0,
            width: newWidget.columns * snapColumnSpace,
            height: newWidget.rows * snapRowSpace,
            columnWidth: newWidget.columns,
            rowHeight: newWidget.rows,
            widgetId: newWidget.widgetId,
            detachFromLayout: newWidget.detachFromLayout,
            isNotColliding: true,
          },
        ],
        draggingSpaces: [
          {
            top: 0,
            left: 0,
            right: newWidget.columns,
            bottom: newWidget.rows,
            id: newWidget.widgetId,
          },
        ],
      };
    } else {
      const draggingSpaces = childrenOccupiedSpaces.filter((each) =>
        selectedWidgets.includes(each.id),
      );
      return {
        draggingSpaces,
        blocksToDraw: draggingSpaces.map((each) => ({
          top: each.top * snapRowSpace + containerPadding,
          left: each.left * snapColumnSpace + containerPadding,
          width: (each.right - each.left) * snapColumnSpace,
          height: (each.bottom - each.top) * snapRowSpace,
          columnWidth: each.right - each.left,
          rowHeight: each.bottom - each.top,
          widgetId: each.id,
          isNotColliding: true,
        })),
      };
    }
  };
  const { blocksToDraw, draggingSpaces } = getBlocksToDraw();
  const dragCenterSpace: any = getDragCenterSpace();

  const filteredChildOccupiedSpaces = childrenOccupiedSpaces.filter(
    (each) => !selectedWidgets.includes(each.id),
  );
  const { updateDropTargetRows } = useContext(DropTargetContext);
  const stopReflowing = () => {
    if (isReflowing) dispatch(stopReflowAction());
  };
  const onDrop = (
    drawingBlocks: WidgetDraggingBlock[],
    reflowedPositionsUpdatesWidgets: OccupiedSpace[],
  ) => {
    logContainerJumpOnDrop();
    const reflowedBlocks: WidgetDraggingBlock[] = reflowedPositionsUpdatesWidgets.map(
      (each) => {
        const widget = allWidgets[each.id];
        return {
          left: each.left * snapColumnSpace,
          top: each.top * snapRowSpace,
          width: (each.right - each.left) * snapColumnSpace,
          height: (each.bottom - each.top) * snapRowSpace,
          columnWidth: snapColumnSpace,
          rowHeight: snapRowSpace,
          widgetId: widget.widgetId,
          isNotColliding: true,
          detachFromLayout: widget.detachFromLayout,
        };
      },
    );
    const reflowedIds = reflowedPositionsUpdatesWidgets.map((each) => each.id);
    const allUpdatedBlocks = [...drawingBlocks, ...reflowedBlocks];
    const cannotDrop = allUpdatedBlocks.some((each) => {
      return !each.isNotColliding;
    });
    if (!cannotDrop) {
      const draggedBlocksToUpdate = allUpdatedBlocks
        .sort(
          (each1, each2) =>
            each1.top + each1.height - (each2.top + each2.height),
        )
        .map((each) => {
          const widget =
            newWidget && !reflowedIds.includes(each.widgetId)
              ? newWidget
              : allWidgets[each.widgetId];
          const updateWidgetParams = widgetOperationParams(
            widget,
            { x: each.left, y: each.top },
            { x: 0, y: 0 },
            snapColumnSpace,
            snapRowSpace,
            widget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : widgetId,
            { width: each.width, height: each.height },
          );

          return {
            ...each,
            updateWidgetParams,
          };
        });
      dispatchDrop(draggedBlocksToUpdate);
    }
  };

  const dispatchDrop = (
    draggedBlocksToUpdate: WidgetDraggingUpdateParams[],
  ) => {
    if (isNewWidget) {
      const newWidget = draggedBlocksToUpdate.find(
        (each) => each.updateWidgetParams.operation === "ADD_CHILD",
      );
      const movedWidgets = draggedBlocksToUpdate.filter(
        (each) => each.updateWidgetParams.operation !== "ADD_CHILD",
      );
      if (newWidget) {
        addNewWidget(newWidget, movedWidgets);
      }
    } else {
      bulkMoveWidgets(draggedBlocksToUpdate);
    }
  };

  const bulkMoveWidgets = (
    draggedBlocksToUpdate: WidgetDraggingUpdateParams[],
  ) => {
    dispatch({
      type: ReduxActionTypes.WIDGETS_MOVE,
      payload: {
        draggedBlocksToUpdate,
        canvasId: widgetId,
      },
    });
  };

  const addNewWidget = (
    newWidget: WidgetDraggingUpdateParams,
    movedWidgets: WidgetDraggingUpdateParams[],
  ) => {
    const { updateWidgetParams } = newWidget;
    if (movedWidgets && movedWidgets.length) {
      dispatch({
        type: ReduxActionTypes.WIDGETS_ADD_CHILD_AND_MOVE,
        payload: {
          newWidget: updateWidgetParams.payload,
          draggedBlocksToUpdate: movedWidgets,
          canvasId: widgetId,
        },
      });
    } else {
      updateWidget &&
        updateWidget(
          updateWidgetParams.operation,
          updateWidgetParams.widgetId,
          updateWidgetParams.payload,
        );
    }

    // close filter pane if any open, before property pane open
    tableFilterPaneState.isVisible &&
      dispatch({
        type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
        payload: { widgetId: tableFilterPaneState.widgetId },
      });
    // Adding setTimeOut to allow property pane to open only after widget is loaded.
    // Not needed for most widgets except for Modal Widget.
    setTimeout(() => {
      selectWidget(updateWidgetParams.payload.newWidgetId);
    }, 100);
    AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
      widgetType: dragDetails.newWidget.type,
      widgetName: dragDetails.newWidget.widgetCardName,
      didDrop: true,
    });
  };
  const updateRelativeRows = (
    drawingBlocks: WidgetDraggingBlock[],
    rows: number,
  ) => {
    if (drawingBlocks.length) {
      const sortedByTopBlocks = drawingBlocks.sort(
        (each1, each2) => each2.top + each2.height - (each1.top + each1.height),
      );
      const bottomMostBlock = sortedByTopBlocks[0];
      const [, top] = getDropZoneOffsets(
        snapColumnSpace,
        snapRowSpace,
        {
          x: bottomMostBlock.left,
          y: bottomMostBlock.top + bottomMostBlock.height,
        } as XYCord,
        { x: 0, y: 0 },
      );
      const widgetIdsToExclude = drawingBlocks.map((a) => a.widgetId);
      return updateBottomRow(top, rows, widgetIdsToExclude);
    }
  };
  const updateBottomRow = (
    bottom: number,
    rows: number,
    widgetIdsToExclude: string[],
  ) => {
    if (bottom > rows - GridDefaults.CANVAS_EXTENSION_OFFSET) {
      return (
        updateDropTargetRows && updateDropTargetRows(widgetIdsToExclude, bottom)
      );
    }
  };
  const rowRef = useRef(snapRows);
  useEffect(() => {
    rowRef.current = snapRows;
  }, [snapRows, isDragging]);

  const isChildOfCanvas = dragParent === widgetId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === widgetId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && widgetId === MAIN_CONTAINER_WIDGET_ID;
  const parentDiff = isDragging
    ? {
        top:
          !isChildOfCanvas && !isEmpty(dragCenterSpace)
            ? dragCenterSpace.top * snapRowSpace + containerPadding
            : containerPadding,
        left:
          !isChildOfCanvas && !isEmpty(dragCenterSpace)
            ? dragCenterSpace.left * snapColumnSpace + containerPadding
            : containerPadding,
      }
    : {
        top: 0,
        left: 0,
      };

  const relativeStartPoints =
    isDragging && !isEmpty(dragCenterSpace)
      ? {
          left:
            ((isChildOfCanvas ? dragCenterSpace.left : 0) +
              dragDetails.dragOffset.left) *
              snapColumnSpace +
            2 * containerPadding,
          top:
            ((isChildOfCanvas ? dragCenterSpace.top : 0) +
              dragDetails.dragOffset.top) *
              snapRowSpace +
            2 * containerPadding,
        }
      : defaultHandlePositions;
  const currentOccSpaces = occupiedSpaces[widgetId] || [];
  const occSpaces: OccupiedSpace[] = isChildOfCanvas
    ? filteredChildOccupiedSpaces
    : currentOccSpaces;
  return {
    blocksToDraw,
    defaultHandlePositions,
    getSnappedXY,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    lastDraggedCanvas,
    logContainerJump,
    occSpaces,
    draggingSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    stopReflowing,
    updateBottomRow,
    updateRelativeRows,
    widgetOccupiedSpace: childrenOccupiedSpaces.filter(
      (each) => each.id === dragCenter?.widgetId,
    )[0],
  };
};

import { useContext, useEffect, useRef } from "react";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getSelectedWidgets } from "selectors/ui";
import { getOccupiedSpacesWhileMoving } from "selectors/editorSelectors";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import type {
  OccupiedSpace,
  WidgetSpace,
} from "constants/CanvasEditorConstants";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import type { WidgetOperationParams } from "utils/WidgetPropsUtils";
import {
  getDropZoneOffsets,
  widgetOperationParams,
} from "utils/WidgetPropsUtils";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";
import type { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { snapToGrid } from "utils/helpers";
import { stopReflowAction } from "actions/reflowActions";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { getIsReflowing } from "selectors/widgetReflowSelectors";
import type { XYCord } from "pages/common/CanvasArenas/hooks/useRenderBlocksOnCanvas";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { AlignItems, LayoutDirection } from "utils/autoLayout/constants";
import type { HighlightInfo } from "utils/autoLayout/autoLayoutTypes";

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
  fixedHeight?: number;
  type: string;
};

export const useBlocksToBeDraggedOnCanvas = ({
  alignItems,
  direction,
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
  const occupiedSpaces = useSelector(getOccupiedSpacesWhileMoving, equal) || {};
  const isNewWidget = !!newWidget && !dragParent;
  const childrenOccupiedSpaces: WidgetSpace[] =
    (dragParent && occupiedSpaces[dragParent]) || [];
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const { updateWidget } = useContext(EditorContext);

  const allWidgets = useSelector(getWidgets);

  // modify the positions to have grab position on the right side for new widgets
  if (isNewWidget) {
    defaultHandlePositions.left =
      newWidget.columns * snapColumnSpace - defaultHandlePositions.left;
  }
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
            fixedHeight: newWidget.isDynamicHeight
              ? newWidget.rows * snapRowSpace
              : undefined,
            type: newWidget.type,
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
          fixedHeight: each.fixedHeight,
          type: allWidgets[each.id].type,
        })),
      };
    }
  };
  const { blocksToDraw, draggingSpaces } = getBlocksToDraw();

  const dragCenterSpace: any = getDragCenterSpace();
  // get spaces occupied by unselected children
  const filteredChildOccupiedSpaces = childrenOccupiedSpaces.filter(
    (each) => !selectedWidgets.includes(each.id),
  );
  const { updateDropTargetRows } = useContext(DropTargetContext);
  const stopReflowing = () => {
    if (isReflowing) dispatch(stopReflowAction());
  };
  const updateChildrenPositions = (
    dropPayload: HighlightInfo,
    drawingBlocks: WidgetDraggingBlock[],
  ): void => {
    if (isNewWidget) addNewWidgetToAutoLayout(dropPayload, drawingBlocks);
    else
      dispatch({
        type: ReduxActionTypes.AUTOLAYOUT_REORDER_WIDGETS,
        payload: {
          dropPayload,
          movedWidgets: selectedWidgets,
          parentId: widgetId,
          direction,
        },
      });
  };
  const addNewWidgetToAutoLayout = (
    dropPayload: HighlightInfo,
    drawingBlocks: WidgetDraggingBlock[],
  ) => {
    const blocksToUpdate = drawingBlocks.map((each) => {
      const updateWidgetParams = widgetOperationParams(
        newWidget,
        { x: 0, y: each.top },
        { x: 0, y: 0 },
        snapColumnSpace,
        snapRowSpace,
        newWidget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : widgetId,
        {
          width: each.width,
          height: each.height,
        },
        direction === LayoutDirection.Vertical &&
          alignItems === AlignItems.Stretch,
      );
      return {
        ...each,
        updateWidgetParams,
      };
    });
    // Add alignment to props of the new widget
    const widgetPayload = {
      ...blocksToUpdate[0]?.updateWidgetParams?.payload,
      props: {
        ...blocksToUpdate[0]?.updateWidgetParams?.payload?.props,
        alignment: dropPayload.alignment,
      },
    };
    setTimeout(() => {
      selectWidget(widgetPayload.newWidgetId);
    }, 100);
    dispatch({
      type: ReduxActionTypes.AUTOLAYOUT_ADD_NEW_WIDGETS,
      payload: {
        dropPayload,
        newWidget: widgetPayload,
        parentId: newWidget.detachFromLayout
          ? MAIN_CONTAINER_WIDGET_ID
          : widgetId,
        direction,
      },
    });
  };
  const onDrop = (
    drawingBlocks: WidgetDraggingBlock[],
    reflowedPositionsUpdatesWidgets: OccupiedSpace[],
  ) => {
    const reflowedBlocks: WidgetDraggingBlock[] =
      reflowedPositionsUpdatesWidgets.map((each) => {
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
          type: widget.type,
        };
      });
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
              ? {
                  ...newWidget,
                  columns: each.columnWidth,
                  rows: each.rowHeight,
                }
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
      selectWidget(SelectionRequestType.One, [
        updateWidgetParams.payload.newWidgetId,
      ]);
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
    occSpaces,
    draggingSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    stopReflowing,
    updateBottomRow,
    updateChildrenPositions,
    updateRelativeRows,
    widgetOccupiedSpace: childrenOccupiedSpaces.filter(
      (each) => each.id === dragCenter?.widgetId,
    )[0],
  };
};

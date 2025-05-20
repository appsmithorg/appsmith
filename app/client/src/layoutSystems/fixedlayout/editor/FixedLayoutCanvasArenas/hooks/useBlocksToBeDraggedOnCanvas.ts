import {
  CONTAINER_GRID_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { DefaultRootState } from "react-redux";
import { getSelectedWidgets } from "selectors/ui";
import { getOccupiedSpacesWhileMoving } from "selectors/editorSelectors";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import type {
  OccupiedSpace,
  WidgetSpace,
} from "constants/CanvasEditorConstants";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import { widgetOperationParams } from "utils/WidgetPropsUtils";
import { DropTargetContext } from "layoutSystems/common/dropTarget/DropTargetComponent";
import equal from "fast-deep-equal/es6";
import type { FixedCanvasDraggingArenaProps } from "../FixedCanvasDraggingArena";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { snapToGrid } from "utils/helpers";
import { stopReflowAction } from "actions/reflowActions";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { getIsReflowing } from "selectors/widgetReflowSelectors";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useContext, useEffect, useRef } from "react";
import type {
  WidgetDraggingBlock,
  WidgetDraggingUpdateParams,
  XYCord,
} from "../../../../common/canvasArenas/ArenaTypes";
import {
  getBlocksToDraw,
  getParentDiff,
  getRelativeStartPoints,
  getBoundUpdateRelativeRowsMethod,
  updateBottomRow as updateBottomRowHelper,
  getDragCenterSpace,
} from "layoutSystems/common/utils/canvasDraggingUtils";

/**
 * useBlocksToBeDraggedOnCanvas, provides information or functions/methods related to drag n drop,
 * that can be used to draw rectangle blocks on canvas, information of widgets being dragged on canvas, method to dispatch action on drop etc...
 * @param useBlocksToBeDraggedOnCanvas is an object that includes properties like
 * @prop noPad, indicates if the widget canvas has padding
 * @prop snapColumnSpace, width between two columns grid
 * @prop snapRows, number of rows in the canvas
 * @prop snapRowSpace, height between two row grid
 * @prop widgetId, id of the current widget canvas associated with current AutoCanvasDraggingArena
 * @returns object containing below props,
 * @returnProp blocksToDraw, contains information regarding the widget and positions in pixels
 * @returnProp defaultHandlePositions, position of the grab handle of the widget with respect to the widget
 * @returnProp draggingSpaces, only contains the position of the widget in grid columns and rows
 * @returnProp isChildOfCanvas, indicates if the dragging widgets are the original child of the canvas
 * @returnProp isCurrentDraggedCanvas, indicates if the widget is being dragged on the canvas associated with this hook
 * @returnProp isDragging, indicates if editor is in widget dragging mode
 * @returnProp isNewWidget, indicates if it is a new Widget
 * @returnProp isNewWidgetInitialTargetCanvas, indicates if the new widget is being dragged on the main canvas
 * @returnProp isResizing, indicates if any widget is currently being resized
 * @returnProp lastDraggedCanvas, id of the canvas widget where the dragging started
 * @returnProp occSpaces, object map of positions of widget inside the current canvas associated with this hook
 * @returnProp onDrop, is called when dragging widgets is dropped to dispatch action to update widget positions on canvas
 * @returnProp parentDiff, positions in pixels that needs to be offsetted with the widget's positions to get it's actual position on parent canvas
 * @returnProp relativeStartPoints, the relative drag start points of the dragging blocks with respect to the dragging group's center
 * @returnProp rowRef, ref object of number of rows on canvas
 * @returnProp stopReflowing, method to dispatch stop reflowing of widgets/ exit reflowing state
 * @returnProp updateBottomRow, is used to update bottom rows of the canvas
 * @returnProp updateRelativeRows, is used to calculate the bottom most row and update bottom rows of the canvas
 */
export const useBlocksToBeDraggedOnCanvas = ({
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: FixedCanvasDraggingArenaProps) => {
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
    (state: DefaultRootState) => state.ui.widgetDragResize.isResizing,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const occupiedSpaces = useSelector(getOccupiedSpacesWhileMoving, equal);
  const isNewWidget = !!newWidget && !dragParent;
  const childrenOccupiedSpaces: WidgetSpace[] =
    (dragParent && occupiedSpaces[dragParent]) || [];
  const isDragging = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isDragging,
  );
  const { updateWidget } = useContext(EditorContext);

  const allWidgets = useSelector(getWidgets);

  // modify the positions to have grab position on the right side for new widgets
  if (isNewWidget) {
    defaultHandlePositions.left =
      newWidget.columns * snapColumnSpace - defaultHandlePositions.left;
  }

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

  const { blocksToDraw, draggingSpaces } = getBlocksToDraw(
    newWidget,
    allWidgets,
    isNewWidget,
    snapColumnSpace,
    snapRowSpace,
    childrenOccupiedSpaces,
    selectedWidgets,
    containerPadding,
  );

  const dragCenterSpace = getDragCenterSpace(
    dragCenter,
    childrenOccupiedSpaces,
  );
  // get spaces occupied by unselected children
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

  const rowRef = useRef(snapRows);

  useEffect(() => {
    rowRef.current = snapRows;
  }, [snapRows, isDragging]);

  const isChildOfCanvas = dragParent === widgetId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === widgetId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && widgetId === MAIN_CONTAINER_WIDGET_ID;

  const updateBottomRow = (
    bottom: number,
    rows: number,
    widgetIdsToExclude: string[],
  ) => {
    return updateBottomRowHelper(
      bottom,
      rows,
      widgetIdsToExclude,
      updateDropTargetRows,
    );
  };

  const parentDiff = getParentDiff(
    dragCenterSpace,
    isDragging,
    isChildOfCanvas,
    snapRowSpace,
    snapColumnSpace,
    containerPadding,
  );

  const relativeStartPoints = getRelativeStartPoints(
    dragCenterSpace,
    dragDetails.dragOffset,
    defaultHandlePositions,
    isDragging,
    isChildOfCanvas,
    snapRowSpace,
    snapColumnSpace,
    containerPadding,
  );

  const currentOccSpaces = occupiedSpaces[widgetId] || [];
  const occSpaces: OccupiedSpace[] = isChildOfCanvas
    ? filteredChildOccupiedSpaces
    : currentOccSpaces;

  return {
    blocksToDraw,
    defaultHandlePositions,
    draggingSpaces,
    getSnappedXY,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    lastDraggedCanvas,
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    stopReflowing,
    updateBottomRow,
    updateRelativeRows: getBoundUpdateRelativeRowsMethod(
      updateDropTargetRows,
      snapColumnSpace,
      snapRowSpace,
    ),
  };
};

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
import { OccupiedSpace } from "constants/editorConstants";
import { getDragDetails, getWidgets } from "sagas/selectors";
import {
  getDropZoneOffsets,
  WidgetOperationParams,
  widgetOperationParams,
} from "utils/WidgetPropsUtils";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { XYCord } from "utils/hooks/useCanvasDragging";
import { isEmpty } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasDraggingArena";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { useShowPropertyPane } from "./dragResizeHooks";
import { useWidgetSelection } from "./useWidgetSelection";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { snapToGrid } from "utils/helpers";

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

export const useBlocksToBeDraggedOnCanvas = ({
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: CanvasDraggingArenaProps) => {
  const dispatch = useDispatch();
  const showPropertyPane = useShowPropertyPane();
  const { selectWidget } = useWidgetSelection();
  const containerPadding = noPad ? 0 : CONTAINER_GRID_PADDING;

  // check any table filter is open or not
  // if filter pane open, close before property pane open
  const tableFilterPaneState = useSelector(getTableFilterState);
  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails = useSelector(getDragDetails);
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
  const occupiedSpaces = useSelector(getOccupiedSpaces) || {};
  const isNewWidget = !!newWidget && !dragParent;
  const childrenOccupiedSpaces: OccupiedSpace[] =
    (dragParent && occupiedSpaces[dragParent]) || [];
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const { updateWidget } = useContext(EditorContext);

  const allWidgets = useSelector(getWidgets);
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
  const getBlocksToDraw = (): WidgetDraggingBlock[] => {
    if (isNewWidget) {
      return [
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
      ];
    } else {
      return childrenOccupiedSpaces
        .filter((each) => selectedWidgets.includes(each.id))
        .map((each) => ({
          top: each.top * snapRowSpace + containerPadding,
          left: each.left * snapColumnSpace + containerPadding,
          width: (each.right - each.left) * snapColumnSpace,
          height: (each.bottom - each.top) * snapRowSpace,
          columnWidth: each.right - each.left,
          rowHeight: each.bottom - each.top,
          widgetId: each.id,
          isNotColliding: true,
        }));
    }
  };
  const blocksToDraw = getBlocksToDraw();
  const dragCenterSpace: any = getDragCenterSpace();

  const filteredChildOccupiedSpaces = childrenOccupiedSpaces.filter(
    (each) => !selectedWidgets.includes(each.id),
  );
  const { updateDropTargetRows } = useContext(DropTargetContext);

  const onDrop = (drawingBlocks: WidgetDraggingBlock[]) => {
    const cannotDrop = drawingBlocks.some((each) => {
      return !each.isNotColliding;
    });
    if (!cannotDrop) {
      const draggedBlocksToUpdate = drawingBlocks
        .sort(
          (each1, each2) =>
            each1.top + each1.height - (each2.top + each2.height),
        )
        .map((each) => {
          const widget = newWidget ? newWidget : allWidgets[each.widgetId];
          const updateWidgetParams = widgetOperationParams(
            widget,
            { x: each.left, y: each.top },
            { x: 0, y: 0 },
            snapColumnSpace,
            snapRowSpace,
            widget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : widgetId,
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
      addNewWidget(draggedBlocksToUpdate[0]);
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

  const addNewWidget = (newWidget: WidgetDraggingUpdateParams) => {
    const { updateWidgetParams } = newWidget;
    updateWidget &&
      updateWidget(
        updateWidgetParams.operation,
        updateWidgetParams.widgetId,
        updateWidgetParams.payload,
      );
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
      showPropertyPane(updateWidgetParams.payload.newWidgetId);
    }, 100);
    AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
      widgetType: dragDetails.newWidget.type,
      widgetName: dragDetails.newWidget.widgetCardName,
      didDrop: true,
    });
  };
  const updateRows = (drawingBlocks: WidgetDraggingBlock[], rows: number) => {
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
      if (top > rows - GridDefaults.CANVAS_EXTENSION_OFFSET) {
        return updateDropTargetRows && updateDropTargetRows(widgetId, top);
      }
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
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    updateRows,
  };
};

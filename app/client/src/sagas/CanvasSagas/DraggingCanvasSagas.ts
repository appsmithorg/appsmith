import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { updateAndSaveLayout, WidgetAddChild } from "actions/pageActions";
import { calculateDropTargetRows } from "components/editorComponents/DropTargetUtils";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { Toaster } from "design-system";
import { cloneDeep } from "lodash";
import log from "loglevel";
import { WidgetDraggingUpdateParams } from "pages/common/CanvasArenas/hooks/useBlocksToBeDraggedOnCanvas";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { MainCanvasReduxState } from "reducers/uiReducers/mainCanvasReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidget, getWidgets } from "sagas/selectors";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import {
  getMainCanvasProps,
  getOccupiedSpacesSelectorForContainer,
} from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { collisionCheckPostReflow } from "utils/reflowHookUtils";
import { WidgetProps } from "widgets/BaseWidget";

export type WidgetMoveParams = {
  widgetId: string;
  leftColumn: number;
  topRow: number;
  bottomRow: number;
  rightColumn: number;
  parentId: string;
  /*
      If newParentId is different from what we have in redux store,
      then we have to delete this,
      as it has been dropped in another container somewhere.
    */
  newParentId: string;
  allWidgets: CanvasWidgetsReduxState;
};

export function* getCanvasSizeAfterWidgetMove(
  canvasWidgetId: string,
  movedWidgetIds: string[],
  movedWidgetsBottomRow: number,
) {
  const canvasWidget: WidgetProps = yield select(getWidget, canvasWidgetId);

  //get mainCanvas's minHeight if the canvasWidget is mianCanvas
  let mainCanvasMinHeight;
  let canvasParentMinHeight = canvasWidget.minHeight;
  if (canvasWidgetId === MAIN_CONTAINER_WIDGET_ID) {
    const mainCanvasProps: MainCanvasReduxState = yield select(
      getMainCanvasProps,
    );
    mainCanvasMinHeight = mainCanvasProps?.height;
  } else if (canvasWidget.parentId) {
    const parent: FlattenedWidgetProps = yield select(
      getWidget,
      canvasWidget.parentId,
    );
    if (!parent.detachFromLayout) {
      canvasParentMinHeight =
        (parent.bottomRow - parent.topRow) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    }
  }
  if (canvasWidget) {
    const occupiedSpacesByChildren: OccupiedSpace[] | undefined = yield select(
      getOccupiedSpacesSelectorForContainer(canvasWidgetId),
    );

    const canvasMinHeight =
      mainCanvasMinHeight ||
      canvasParentMinHeight ||
      CANVAS_DEFAULT_MIN_HEIGHT_PX;

    const newRows = calculateDropTargetRows(
      movedWidgetIds,
      movedWidgetsBottomRow,
      canvasMinHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
      occupiedSpacesByChildren,
      canvasWidgetId,
    );

    const rowsToPersist = Math.max(
      canvasMinHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
      newRows,
    );

    const originalSnapRows = canvasWidget.bottomRow - canvasWidget.topRow;

    const newBottomRow = Math.round(
      rowsToPersist * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    );

    /* Update the canvas's rows, ONLY if it has changed since the last render */
    if (originalSnapRows !== newBottomRow) {
      // TODO(abhinav): This considers that the topRow will always be zero
      // Check this out when non canvas widgets are updating snapRows
      // erstwhile: Math.round((rows * props.snapRowSpace) / props.parentRowSpace),
      return newBottomRow;
    }
    return canvasWidget.bottomRow;
  }
}

const getBottomMostRowAfterMove = (
  draggedBlocksToUpdate: WidgetDraggingUpdateParams[],
  allWidgets: CanvasWidgetsReduxState,
) => {
  const bottomMostBlock =
    draggedBlocksToUpdate[draggedBlocksToUpdate.length - 1];
  const widget = allWidgets[bottomMostBlock.widgetId];
  const { updateWidgetParams } = bottomMostBlock;
  const widgetBottomRow =
    updateWidgetParams.payload.topRow +
    (updateWidgetParams.payload.rows || widget.bottomRow - widget.topRow);
  return widgetBottomRow;
};

function* addWidgetAndMoveWidgetsSaga(
  actionPayload: ReduxAction<{
    newWidget: WidgetAddChild;
    draggedBlocksToUpdate: WidgetDraggingUpdateParams[];
    canvasId: string;
  }>,
) {
  const start = performance.now();

  const { canvasId, draggedBlocksToUpdate, newWidget } = actionPayload.payload;
  try {
    const updatedWidgetsOnAddAndMove: CanvasWidgetsReduxState = yield call(
      addWidgetAndMoveWidgets,
      newWidget,
      draggedBlocksToUpdate,
      canvasId,
    );
    if (
      !collisionCheckPostReflow(
        updatedWidgetsOnAddAndMove,
        draggedBlocksToUpdate.map((block) => block.widgetId),
        canvasId,
      )
    ) {
      throw Error;
    }
    yield put(updateAndSaveLayout(updatedWidgetsOnAddAndMove));
    yield put(generateAutoHeightLayoutTreeAction(true, true));
    yield put({
      type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
      payload: [newWidget.newWidgetId],
    });
    log.debug("move computations took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGETS_ADD_CHILD_AND_MOVE,
        error,
      },
    });
  }
}

function* addWidgetAndMoveWidgets(
  newWidget: WidgetAddChild,
  draggedBlocksToUpdate: WidgetDraggingUpdateParams[],
  canvasId: string,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const updatedWidgetsOnAddition: CanvasWidgetsReduxState = yield call(
    getUpdateDslAfterCreatingChild,
    { ...newWidget, widgetId: canvasId },
  );
  const bottomMostRowOnAddition = updatedWidgetsOnAddition[canvasId]
    ? updatedWidgetsOnAddition[canvasId].bottomRow
    : 0;
  const allWidgetsAfterAddition = {
    ...allWidgets,
    ...updatedWidgetsOnAddition,
  };
  const updatedWidgetsOnMove: CanvasWidgetsReduxState = yield call(
    moveAndUpdateWidgets,
    allWidgetsAfterAddition,
    draggedBlocksToUpdate,
    canvasId,
  );
  const bottomMostRowOnMove = updatedWidgetsOnMove[canvasId]
    ? updatedWidgetsOnMove[canvasId].bottomRow
    : 0;

  const bottomMostRow =
    bottomMostRowOnAddition > bottomMostRowOnMove
      ? bottomMostRowOnAddition
      : bottomMostRowOnMove;
  const updatedWidgets = {
    ...updatedWidgetsOnMove,
  };
  updatedWidgets[canvasId].bottomRow = bottomMostRow;
  return updatedWidgets;
}

function* moveAndUpdateWidgets(
  allWidgets: CanvasWidgetsReduxState,
  draggedBlocksToUpdate: WidgetDraggingUpdateParams[],
  canvasId: string,
) {
  const widgets = cloneDeep(allWidgets);
  const bottomMostRowAfterMove = getBottomMostRowAfterMove(
    draggedBlocksToUpdate,
    allWidgets,
  );
  // draggedBlocksToUpdate is already sorted based on bottomRow
  const updatedWidgets = draggedBlocksToUpdate.reduce((widgetsObj, each) => {
    return moveWidget({
      ...each.updateWidgetParams.payload,
      widgetId: each.widgetId,
      allWidgets: widgetsObj,
    });
  }, widgets);
  const movedWidgetIds = draggedBlocksToUpdate.map((a) => a.widgetId);
  const updatedCanvasBottomRow: number = yield call(
    getCanvasSizeAfterWidgetMove,
    canvasId,
    movedWidgetIds,
    bottomMostRowAfterMove,
  );
  if (updatedCanvasBottomRow) {
    const canvasWidget = updatedWidgets[canvasId];
    updatedWidgets[canvasId] = {
      ...canvasWidget,
      bottomRow: updatedCanvasBottomRow,
    };
  }
  return updatedWidgets;
}

function getParentWidgetType(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
) {
  const widget = allWidgets[widgetId];

  if (!widget.parentId) return "MAIN_CONTAINER";

  const containerWidget = allWidgets[widget.parentId];

  /**
   * container widget can be of type FORM_WIDGET, STATBOX_WIDGET
   */
  if (containerWidget.type !== "CONTAINER_WIDGET") {
    return containerWidget.type;
  }

  /**
   * Handling the case for list widget where we have
   * canvas2 -> container -> canvas1 -> listWidget
   */
  if (containerWidget.parentId) {
    // Take the first parent that is canvas1
    const containerParent = allWidgets[containerWidget.parentId];

    // Now take the parent of canvas1 that is listWidget
    if (containerParent.parentId) {
      const mainParent = allWidgets[containerParent.parentId];
      return mainParent.type;
    }
  }

  return containerWidget.type;
}

function* moveWidgetsSaga(
  actionPayload: ReduxAction<{
    draggedBlocksToUpdate: WidgetDraggingUpdateParams[];
    canvasId: string;
  }>,
) {
  const start = performance.now();

  const { canvasId, draggedBlocksToUpdate } = actionPayload.payload;
  try {
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    const updatedWidgetsOnMove: CanvasWidgetsReduxState = yield call(
      moveAndUpdateWidgets,
      allWidgets,
      draggedBlocksToUpdate,
      canvasId,
    );

    if (
      !collisionCheckPostReflow(
        updatedWidgetsOnMove,
        draggedBlocksToUpdate.map((block) => block.widgetId),
        canvasId,
      )
    ) {
      throw Error;
    }
    yield put(updateAndSaveLayout(updatedWidgetsOnMove));
    yield put(generateAutoHeightLayoutTreeAction(true, true));

    const block = draggedBlocksToUpdate[0];
    const oldParentId = block.updateWidgetParams.payload.parentId;
    const newParentId = block.updateWidgetParams.payload.newParentId;

    const oldParentWidgetType = getParentWidgetType(allWidgets, oldParentId);
    const newParentWidgetType = getParentWidgetType(allWidgets, newParentId);

    AnalyticsUtil.logEvent("WIDGET_DRAG", {
      widgets: draggedBlocksToUpdate.map((block) => {
        const widget = allWidgets[block.widgetId];
        return {
          widgetType: widget.type,
          widgetName: widget.widgetName,
        };
      }),
      multiple: draggedBlocksToUpdate.length > 1,
      movedToNewWidget: oldParentId !== newParentId,
      source: oldParentWidgetType,
      destination: newParentWidgetType,
    });
    log.debug("move computations took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGETS_MOVE,
        error,
      },
    });
  }
}

function moveWidget(widgetMoveParams: WidgetMoveParams) {
  Toaster.clear();
  const {
    allWidgets,
    bottomRow,
    leftColumn,
    newParentId,
    parentId,
    rightColumn,
    topRow,
    widgetId,
  } = widgetMoveParams;
  const stateWidget: FlattenedWidgetProps = allWidgets[widgetId];
  let widget = Object.assign({}, stateWidget);
  // Get all widgets from DSL/Redux Store
  const widgets = Object.assign({}, allWidgets);
  // Get parent from DSL/Redux Store
  const stateParent: FlattenedWidgetProps = allWidgets[parentId];
  const parent = {
    ...stateParent,
    children: [...(stateParent.children || [])],
  };
  // Update position of widget
  const updatedPosition = {
    topRow,
    bottomRow,
    leftColumn,
    rightColumn,
  };
  widget = { ...widget, ...updatedPosition };

  // Replace widget with update widget props
  widgets[widgetId] = widget;
  // If the parent has changed i.e parentWidgetId is not parent.widgetId
  if (parent.widgetId !== newParentId && widgetId !== newParentId) {
    // Remove from the previous parent

    if (parent.children && Array.isArray(parent.children)) {
      const indexOfChild = parent.children.indexOf(widgetId);
      if (indexOfChild > -1) delete parent.children[indexOfChild];
      parent.children = parent.children.filter(Boolean);
    }

    // Add to new parent

    widgets[parent.widgetId] = parent;
    const newParent = {
      ...widgets[newParentId],
      children: widgets[newParentId].children
        ? [...(widgets[newParentId].children || []), widgetId]
        : [widgetId],
    };
    widgets[widgetId].parentId = newParentId;
    widgets[newParentId] = newParent;
  }
  return widgets;
}

export default function* draggingCanvasSagas() {
  yield all([
    takeLatest(ReduxActionTypes.WIDGETS_MOVE, moveWidgetsSaga),
    takeLatest(
      ReduxActionTypes.WIDGETS_ADD_CHILD_AND_MOVE,
      addWidgetAndMoveWidgetsSaga,
    ),
  ]);
}

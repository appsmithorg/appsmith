import { Toaster } from "components/ads/Toast";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import log from "loglevel";
import { cloneDeep } from "lodash";
import { updateAndSaveLayout, WidgetAddChild } from "actions/pageActions";
import { calculateDropTargetRows } from "components/editorComponents/DropTargetUtils";
import { GridDefaults } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { getOccupiedSpacesSelectorForContainer } from "selectors/editorSelectors";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { collisionCheckPostReflow } from "utils/reflowHookUtils";
import { WidgetDraggingUpdateParams } from "pages/common/CanvasArenas/hooks/useBlocksToBeDraggedOnCanvas";
import { getWidget, getWidgets } from "sagas/selectors";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";

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
  if (canvasWidget) {
    const occupiedSpacesByChildren: OccupiedSpace[] | undefined = yield select(
      getOccupiedSpacesSelectorForContainer(canvasWidgetId),
    );
    const canvasMinHeight = canvasWidget.minHeight || 0;
    const newRows = calculateDropTargetRows(
      movedWidgetIds,
      movedWidgetsBottomRow,
      canvasMinHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
      occupiedSpacesByChildren,
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

import { updateAndSaveLayout } from "actions/pageActions";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import log from "loglevel";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  all,
  call,
  debounce,
  put,
  select,
  takeLatest,
} from "redux-saga/effects";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
  removeChildLayers,
  updateFillChildStatus,
  wrapChildren,
} from "../utils/autoLayout/AutoLayoutUtils";
import { getWidgets } from "./selectors";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import { getWidgetMinMaxDimensionsInPixel } from "utils/autoLayout/flexWidgetUtils";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";
import { GridDefaults } from "constants/WidgetConstants";
import { getCanvasWidth } from "utils/autoLayout/highlightUtils";

type LayoutUpdatePayload = {
  parentId: string;
};

function* removeChildWrappers(actionPayload: ReduxAction<LayoutUpdatePayload>) {
  try {
    const start = performance.now();
    const { parentId } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const updatedWidgets: CanvasWidgetsReduxState = removeChildLayers(
      allWidgets,
      parentId,
    );
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("empty wrapper removal took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.REMOVE_CHILD_WRAPPERS,
        error,
      },
    });
  }
}

function* addChildWrappers(actionPayload: ReduxAction<LayoutUpdatePayload>) {
  try {
    const start = performance.now();
    const { parentId } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const isMobile: boolean = yield select(getIsMobile);
    const mainCanvasWidth: number = yield select(getMainCanvasWidth);
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      wrapChildren,
      allWidgets,
      parentId,
      isMobile,
      mainCanvasWidth,
    );
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("empty wrapper removal took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.ADD_CHILD_WRAPPERS,
        error,
      },
    });
  }
}

export function* updateFillChildInfo(
  actionPayload: ReduxAction<{
    widgetId: string;
    responsiveBehavior: ResponsiveBehavior;
  }>,
) {
  try {
    const start = performance.now();
    const { responsiveBehavior, widgetId } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const isMobile: boolean = yield select(getIsMobile);
    const mainCanvasWidth: number = yield select(getMainCanvasWidth);
    const updatedWidgets: CanvasWidgetsReduxState = updateFillChildStatus(
      allWidgets,
      widgetId,
      responsiveBehavior === ResponsiveBehavior.Fill,
      isMobile,
      mainCanvasWidth,
    );
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("updating fill child info took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.UPDATE_FILL_CHILD_LAYER,
        error,
      },
    });
  }
}

export function* updateLayoutForMobileCheckpoint(
  actionPayload: ReduxAction<{
    parentId: string;
    isMobile: boolean;
    canvasWidth: number;
  }>,
) {
  try {
    const start = performance.now();
    const { canvasWidth, isMobile, parentId } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const mainCanvasWidth: number = yield select(getMainCanvasWidth);
    const updatedWidgets: CanvasWidgetsReduxState = isMobile
      ? alterLayoutForMobile(allWidgets, parentId, canvasWidth, canvasWidth)
      : alterLayoutForDesktop(allWidgets, parentId, mainCanvasWidth);
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug(
      "updating layout for mobile viewport took",
      performance.now() - start,
      "ms",
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.RECALCULATE_COLUMNS,
        error,
      },
    });
  }
}

// const processedParentIds = new Map();

// function* widgetViolatedMinDimensionsSaga(
//   action: ReduxAction<{ parentId: string }>,
// ) {
//   const isMobile: boolean = yield select(getIsMobile);
//   const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
//   const mainCanvasWidth: number = yield select(getCanvasWidth);

//   const parentId = action.payload.parentId;
//   if (processedParentIds.has(parentId)) return;
//   processedParentIds.set(parentId, true);
//   setTimeout(() => processedParentIds.delete(parentId), 1000);
//   const updatedWidgets = updateWidgetPositions(
//     allWidgets,
//     parentId,
//     isMobile,
//     mainCanvasWidth,
//   );
//   yield put(updateAndSaveLayout(updatedWidgets));
// }

let autoLayoutWidgetDimensionUpdateBatch: Record<
  string,
  { width: number; height: number }
> = {};

function addWidgetToAutoLayoutDimensionUpdateBatch(
  widgetId: string,
  width: number,
  height: number,
) {
  autoLayoutWidgetDimensionUpdateBatch[widgetId] = { width, height };
}

function* updateWidgetDimensionsSaga(
  action: ReduxAction<{ widgetId: string; width: number; height: number }>,
) {
  let { height, width } = action.payload;
  const { widgetId } = action.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const isLayoutUpdating: boolean = yield select(getIsDraggingOrResizing);

  const widget = allWidgets[widgetId];
  const widgetMinMaxDimensions = getWidgetMinMaxDimensionsInPixel(
    widget,
    mainCanvasWidth,
  );

  console.log("#### addtobatch", widget.widgetName, width, height);

  if (
    widgetMinMaxDimensions.minHeight &&
    height < widgetMinMaxDimensions.minHeight
  ) {
    height = widgetMinMaxDimensions.minHeight;
  }
  if (
    widgetMinMaxDimensions.maxHeight &&
    height > widgetMinMaxDimensions.maxHeight
  ) {
    height = widgetMinMaxDimensions.maxHeight;
  }
  if (
    widgetMinMaxDimensions.minWidth &&
    width < widgetMinMaxDimensions.minWidth
  ) {
    width = widgetMinMaxDimensions.minWidth;
  }
  if (
    widgetMinMaxDimensions.maxWidth &&
    width > widgetMinMaxDimensions.maxWidth
  ) {
    width = widgetMinMaxDimensions.maxWidth;
  }

  addWidgetToAutoLayoutDimensionUpdateBatch(widgetId, width, height);
  console.log("#### addtobatch done", widget.widgetName, width, height);
  if (isLayoutUpdating) return;
  yield put({
    type: ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
  });
}

function* processAutoLayoutDimensionUpdatesSaga() {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const isMobile: boolean = yield select(getIsMobile);

  let widgets = allWidgets;
  const parentIds = new Set<string>();
  for (const widgetId in autoLayoutWidgetDimensionUpdateBatch) {
    const { height, width } = autoLayoutWidgetDimensionUpdateBatch[widgetId];
    const widget = allWidgets[widgetId];
    console.log("#### parentId", widget.widgetName, widget?.parentId, widget);
    const parentId = widget.parentId;
    if (parentId === undefined) continue;
    if (parentId) parentIds.add(parentId);

    const canvasWidth = getCanvasWidth(
      widgets[parentId],
      widgets,
      mainCanvasWidth,
      isMobile,
    );
    const columnSpace = canvasWidth / GridDefaults.DEFAULT_GRID_COLUMNS;
    console.log(
      "#### columnSpace",
      widget.widgetName,
      widget.parentColumnSpace,
      columnSpace,
    );

    widgets = {
      ...widgets,
      [widgetId]: {
        ...widget,
        bottomRow: widget.topRow + height / widget.parentRowSpace,
        rightColumn: widget.leftColumn + width / columnSpace,
      },
    };
  }

  for (const parentId of parentIds) {
    widgets = updateWidgetPositions(
      widgets,
      parentId,
      isMobile,
      mainCanvasWidth,
    );
  }
  yield put(updateAndSaveLayout(widgets));

  // clear the batch after processing
  autoLayoutWidgetDimensionUpdateBatch = {};
}

export default function* layoutUpdateSagas() {
  yield all([
    takeLatest(ReduxActionTypes.ADD_CHILD_WRAPPERS, addChildWrappers),
    takeLatest(ReduxActionTypes.REMOVE_CHILD_WRAPPERS, removeChildWrappers),
    takeLatest(ReduxActionTypes.UPDATE_FILL_CHILD_LAYER, updateFillChildInfo),
    takeLatest(
      ReduxActionTypes.RECALCULATE_COLUMNS,
      updateLayoutForMobileCheckpoint,
    ),
    // takeLatest(
    //   ReduxActionTypes.WIDGET_VIOLATED_MIN_DIMENSIONS,
    //   widgetViolatedMinDimensionsSaga,
    // ),
    takeLatest(
      ReduxActionTypes.UPDATE_WIDGET_DIMENSIONS,
      updateWidgetDimensionsSaga,
    ),
    debounce(
      50,
      ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
      processAutoLayoutDimensionUpdatesSaga,
    ),
  ]);
}

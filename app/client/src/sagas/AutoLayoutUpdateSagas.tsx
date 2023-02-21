import { updateAndSaveLayout } from "actions/pageActions";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import log from "loglevel";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, debounce, put, select, takeLatest } from "redux-saga/effects";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
  getCanvasDimensions,
} from "../utils/autoLayout/AutoLayoutUtils";
import { getWidgets } from "./selectors";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import { getWidgetMinMaxDimensionsInPixel } from "utils/autoLayout/flexWidgetUtils";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";

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
  // Initialise a list of changes so far.
  // This contains a map of widgetIds with their new topRow and bottomRow
  const changesSoFar: Record<
    string,
    { bottomRow?: number; rightColumn?: number }
  > = {};
  for (const widgetId in autoLayoutWidgetDimensionUpdateBatch) {
    const { height, width } = autoLayoutWidgetDimensionUpdateBatch[widgetId];
    const widget = allWidgets[widgetId];
    if (!widget) continue;
    const parentId = widget.parentId;
    if (parentId === undefined) continue;
    if (parentId) parentIds.add(parentId);

    const { columnSpace } = getCanvasDimensions(
      widgets[parentId],
      widgets,
      mainCanvasWidth,
      isMobile,
    );

    const newBottomRow = widget.topRow + height / widget.parentRowSpace;
    const newRightColumn = widget.leftColumn + width / columnSpace;

    if (
      widget.bottomRow !== newBottomRow ||
      widget.rightColumn !== newRightColumn
    ) {
      changesSoFar[widgetId] = {
        bottomRow: newBottomRow,
        rightColumn: newRightColumn,
      };
    }

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

  const widgetsToUpdate: any = [];
  for (const changedWidgetId in changesSoFar) {
    widgetsToUpdate[changedWidgetId] = [
      {
        propertyPath: "topRow",
        propertyValue: widgets[changedWidgetId].topRow,
      },
      {
        propertyPath: "bottomRow",
        propertyValue: changesSoFar[changedWidgetId].bottomRow,
      },
      {
        propertyPath: "leftColumn",
        propertyValue: widgets[changedWidgetId].leftColumn,
      },
      {
        propertyPath: "rightColumn",
        propertyValue: changesSoFar[changedWidgetId].rightColumn,
      },
    ];
  }

  // TODO(aswathkk): Use updateMultipleWidgetPropertiesAction instead of updateAndSaveLayout
  // Push all updates to the CanvasWidgetsReducer.
  // Note that we're not calling `UPDATE_LAYOUT`
  // as we don't need to trigger an eval
  // yield put(updateMultipleWidgetPropertiesAction(widgetsToUpdate));

  // Save the layout
  yield put(updateAndSaveLayout(widgets));

  // clear the batch after processing
  autoLayoutWidgetDimensionUpdateBatch = {};
}

export default function* layoutUpdateSagas() {
  yield all([
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

import { updateAndSaveLayout } from "actions/pageActions";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import log from "loglevel";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, put, select, takeLatest } from "redux-saga/effects";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
} from "../utils/autoLayout/AutoLayoutUtils";
import { getWidgets } from "./selectors";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { getCanvasWidth } from "selectors/editorSelectors";
import { getIsMobile } from "selectors/mainCanvasSelectors";

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
    const mainCanvasWidth: number = yield select(getCanvasWidth);
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

const processedParentIds = new Map();

function* widgetViolatedMinDimensionsSaga(
  action: ReduxAction<{ parentId: string }>,
) {
  const isMobile: boolean = yield select(getIsMobile);
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const mainCanvasWidth: number = yield select(getCanvasWidth);

  const parentId = action.payload.parentId;
  if (processedParentIds.has(parentId)) return;
  processedParentIds.set(parentId, true);
  setTimeout(() => processedParentIds.delete(parentId), 1000);
  const updatedWidgets = updateWidgetPositions(
    allWidgets,
    parentId,
    isMobile,
    mainCanvasWidth,
  );
  yield put(updateAndSaveLayout(updatedWidgets));
}

export default function* layoutUpdateSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.RECALCULATE_COLUMNS,
      updateLayoutForMobileCheckpoint,
    ),
    takeLatest(
      ReduxActionTypes.WIDGET_VIOLATED_MIN_DIMENSIONS,
      widgetViolatedMinDimensionsSaga,
    ),
  ]);
}

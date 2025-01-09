import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { UpdateWidgetAutoHeightPayload } from "actions/autoHeightActions";
import { updateAndSaveLayout } from "actions/pageActions";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { put, select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";

// eslint-disable-next-line no-var
var autoHeightUpdateWidgetsQueue: Record<string, number> = {};

export function addWidgetToAutoHeightUpdateQueue(
  widgetId: string,
  height: number,
) {
  if (autoHeightUpdateWidgetsQueue[widgetId] !== height) {
    autoHeightUpdateWidgetsQueue[widgetId] = height;
  }
}

export function resetAutoHeightUpdateQueue() {
  autoHeightUpdateWidgetsQueue = {};
}

export function getAutoHeightUpdateQueue() {
  return autoHeightUpdateWidgetsQueue;
}

export function* batchCallsToUpdateWidgetAutoHeightSaga(
  action: ReduxAction<UpdateWidgetAutoHeightPayload>,
) {
  const isLayoutUpdating: boolean = yield select(getIsDraggingOrResizing);
  const { height, widgetId } = action.payload;

  log.debug("Dynamic height: batching update:", { widgetId, height });
  addWidgetToAutoHeightUpdateQueue(widgetId, height);

  if (isLayoutUpdating) return;

  yield put({
    type: ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
  });
}

// In this saga, we simply call the UPDATE_LAYOUT, with shouldReplay: false
// This makes sure that we call eval, but we don't add the updates to the replay stack
export function* callEvalWithoutReplay(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: ReduxAction<{ widgetsToUpdate: any; shouldEval: boolean }>,
) {
  if (action.payload.shouldEval) {
    const widgets: CanvasWidgetsReduxState = yield select(getWidgets);

    yield put(
      updateAndSaveLayout(widgets, {
        shouldReplay: false,
        isRetry: false,
        updatedWidgetIds: [],
      }),
    );
  }
}

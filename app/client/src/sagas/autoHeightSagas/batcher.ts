import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { UpdateWidgetAutoHeightPayload } from "actions/autoHeightActions";
import log from "loglevel";
import { put, select } from "redux-saga/effects";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";

let autoHeightUpdateWidgetsQueue: Record<string, number> = {};

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

export function* batchCallsToUpdateWidgetDynamicHeightSaga(
  action: ReduxAction<UpdateWidgetAutoHeightPayload>,
) {
  const isLayoutUpdating: boolean = yield select(getIsDraggingOrResizing);
  const { height, widgetId } = action.payload;
  log.debug("Dynamic height: batching update:", { widgetId, height });

  if (isLayoutUpdating) return;
  yield put({
    type: ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
  });
}

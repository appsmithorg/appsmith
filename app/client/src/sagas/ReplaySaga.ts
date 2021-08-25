import { takeEvery, put, select } from "redux-saga/effects";

import { ReplayOperation } from "workers/dslReplay.worker";
import { undoRedoSaga } from "./EvaluationsSaga";

import {
  getIsPropertyPaneVisible,
  getCurrentWidgetId,
} from "../selectors/propertyPaneSelectors";
import {
  closePropertyPane,
  forceOpenPropertyPane,
} from "actions/widgetActions";
import {
  selectMultipleWidgetsAction,
  selectWidgetAction,
} from "actions/widgetSelectionActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  scrollWidgetIntoView,
  processUndoRedoToasts,
} from "utils/UndoRedoHelpers";

export type UndoRedoPayload = {
  operation: ReplayOperation;
};

export default function* undoRedoListenerSaga() {
  yield takeEvery(ReduxActionTypes.UNDO_REDO_OPERATION, undoRedoSaga);
}

export function* openPropertyPaneSaga(replay: any) {
  const replayWidgetId = Object.keys(replay.widgets)[0];

  if (!replayWidgetId) return;

  scrollWidgetIntoView(replayWidgetId);

  const isPropertyPaneVisible = yield select(getIsPropertyPaneVisible);
  const selectedWidgetId = yield select(getCurrentWidgetId);

  if (selectedWidgetId !== replayWidgetId || !isPropertyPaneVisible) {
    yield put(selectWidgetAction(replayWidgetId, false));
    yield put(forceOpenPropertyPane(replayWidgetId));
  }
}

export function* postUndoRedoSaga(replay: any) {
  const isPropertyPaneVisible = yield select(getIsPropertyPaneVisible);

  if (isPropertyPaneVisible) yield put(closePropertyPane());

  if (replay.toasts && replay.toasts.length > 0) {
    processUndoRedoToasts(replay.toasts);
  }

  if (replay.widgets && Object.keys(replay.widgets).length <= 0) return;

  const widgetIds = Object.keys(replay.widgets);

  if (widgetIds.length > 1) {
    yield put(selectMultipleWidgetsAction(widgetIds));
  } else {
    yield put(selectWidgetAction(widgetIds[0], false));
  }
  scrollWidgetIntoView(widgetIds[0]);
}

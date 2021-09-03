import { takeEvery, put, select } from "redux-saga/effects";

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
import {
  ReduxActionTypes,
  ReplayReduxActionTypes,
} from "constants/ReduxActionConstants";
import { flashElementsById } from "utils/helpers";
import {
  scrollWidgetIntoView,
  processUndoRedoToasts,
} from "utils/replayHelpers";

export type UndoRedoPayload = {
  operation: ReplayReduxActionTypes;
};

export default function* undoRedoListenerSaga() {
  yield takeEvery(ReduxActionTypes.UNDO_REDO_OPERATION, undoRedoSaga);
}

export function* openPropertyPaneSaga(replay: any) {
  const replayWidgetId = Object.keys(replay.widgets)[0];

  if (!replayWidgetId || !replay.widgets[replayWidgetId].propertyUpdates)
    return;

  scrollWidgetIntoView(replayWidgetId);

  const isPropertyPaneVisible: boolean = yield select(getIsPropertyPaneVisible);
  const selectedWidgetId: string = yield select(getCurrentWidgetId);

  let flashTimeout = 500;

  if (selectedWidgetId !== replayWidgetId || !isPropertyPaneVisible) {
    yield put(selectWidgetAction(replayWidgetId, false));
    yield put(forceOpenPropertyPane(replayWidgetId));
    flashTimeout = 1000;
  }

  flashElementsById(
    btoa(replay.widgets[replayWidgetId].propertyUpdates.join(".")),
    0,
    flashTimeout,
    "#E0DEDE",
  );
}

export function* postUndoRedoSaga(replay: any) {
  const isPropertyPaneVisible: boolean = yield select(getIsPropertyPaneVisible);

  if (isPropertyPaneVisible) yield put(closePropertyPane());

  if (replay.toasts && replay.toasts.length > 0) {
    processUndoRedoToasts(replay.toasts);
  }

  if (!replay.widgets || Object.keys(replay.widgets).length <= 0) return;

  const widgetIds = Object.keys(replay.widgets);

  if (widgetIds.length > 1) {
    yield put(selectMultipleWidgetsAction(widgetIds));
  } else {
    yield put(selectWidgetAction(widgetIds[0], false));
  }
  scrollWidgetIntoView(widgetIds[0]);
}

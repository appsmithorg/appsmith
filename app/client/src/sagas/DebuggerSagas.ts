import { debuggerLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetTypes } from "constants/WidgetConstants";
import { LogActionPayload } from "entities/AppsmithConsole";
import { all, call, put, takeEvery, select } from "redux-saga/effects";
import { getWidget } from "./selectors";

function* filterWidgetPropertiesSaga(payload: LogActionPayload) {
  if (!payload.source) return;

  const widget = yield select(getWidget, payload.source.id);

  if (widget.type === WidgetTypes.CANVAS_WIDGET) {
    return;
  }

  yield put(debuggerLog(payload));
}

function* debuggerLogSaga(action: ReduxAction<LogActionPayload>) {
  const { payload } = action;

  if (payload.logType === "WIDGET_UPDATE") {
    yield call(filterWidgetPropertiesSaga, payload);
    return;
  }

  yield put(debuggerLog(payload));
}

export default function* debuggerSagasListeners() {
  yield all([takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga)]);
}

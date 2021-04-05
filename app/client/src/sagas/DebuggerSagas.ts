import { debuggerLog, errorLog, updateErrorLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetTypes } from "constants/WidgetConstants";
import { LogActionPayload } from "entities/AppsmithConsole";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { all, put, takeEvery, select, fork } from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import { get, isEmpty } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";

function* onWidgetUpdateSaga(payload: LogActionPayload) {
  if (!payload.source) return;

  const dataTree = yield select(getDataTree);
  const widget = dataTree[payload.source.name];

  // Ignore canvas widget updates
  if (widget.type === WidgetTypes.CANVAS_WIDGET) {
    return;
  }
  const source = payload.source;

  // If widget properties no longer have validation errors update the same
  if (payload.state) {
    const propertyPath = Object.keys(payload.state)[0];

    const validationMessages = dataTree[payload.source.name].validationMessages;
    const validationMessage = validationMessages[propertyPath];
    const errors = yield select(getDebuggerErrors);
    const widgetErrorLog = errors[source.id];
    const noError = isEmpty(validationMessage[propertyPath]);

    if (noError && widgetErrorLog.state[propertyPath]) {
      delete widgetErrorLog.state[propertyPath];

      yield put(updateErrorLog(widgetErrorLog));
    }
  }
}

function* debuggerLogSaga(action: ReduxAction<LogActionPayload>) {
  const { payload } = action;
  yield put(debuggerLog(payload));

  switch (payload.logType) {
    case "WIDGET_UPDATE":
      yield fork(onWidgetUpdateSaga, payload);
      return;
    case "WIDGET_PROPERTY_VALIDATION_ERROR":
      if (payload.source && payload.source.propertyPath) {
        const dataTree = yield select(getDataTree);
        const widget: DataTreeWidget = dataTree[payload.source.name];

        if (get(widget, `validationMessages.${payload.source.propertyPath}`)) {
          yield put(
            errorLog({
              ...payload,
              text: "Widget properties have errors",
              state: {
                [payload.source.propertyPath]: get(
                  widget,
                  `validationMessages.${payload.source.propertyPath}`,
                ),
              },
            }),
          );
        }
      }
      break;
    case "ACTION_EXECUTION_ERROR":
      yield put(errorLog(payload));
      break;
    case "ACTION_EXECUTION_SUCCESS":
      yield put(
        updateErrorLog({
          ...payload,
          state: {},
        }),
      );
      break;
  }
}

export default function* debuggerSagasListeners() {
  yield all([takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga)]);
}

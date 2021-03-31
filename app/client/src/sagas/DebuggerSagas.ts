import { debuggerLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetTypes } from "constants/WidgetConstants";
import { LogActionPayload } from "entities/AppsmithConsole";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { all, call, put, takeEvery, select } from "redux-saga/effects";
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

    const validationMessage: DataTreeWidget =
      dataTree[payload.source.name].validationMessages[propertyPath];
    const errors = yield select(getDebuggerErrors);
    const widgetErrorLog = errors[source.id];

    if (isEmpty(validationMessage[propertyPath])) {
      delete widgetErrorLog.state[propertyPath];

      yield put({
        type: "DEBUGGER_UPDATE_ERROR_LOG",
        payload: widgetErrorLog,
      });
    }
  }

  yield put(debuggerLog(payload));
}

function* debuggerLogSaga(action: ReduxAction<LogActionPayload>) {
  const { payload } = action;

  switch (payload.logType) {
    case "WIDGET_UPDATE":
      yield call(onWidgetUpdateSaga, payload);
      return;
    case "WIDGET_PROPERTY_VALIDATION_ERROR":
      if (payload.source && payload.source.propertyPath) {
        const dataTree = yield select(getDataTree);
        const widget: DataTreeWidget = dataTree[payload.source.name];

        if (get(widget, `validationMessages.${payload.source.propertyPath}`)) {
          yield put({
            type: "DEBUGGER_ERROR_LOG",
            payload: {
              ...payload,
              text: "Widget properties have errors",
              state: {
                [payload.source.propertyPath]: get(
                  widget,
                  `validationMessages.${payload.source.propertyPath}`,
                ),
              },
            },
          });
        }
      }
      break;
    case "ACTION_EXECUTION_ERROR":
      yield put({
        type: "DEBUGGER_ERROR_LOG",
        payload,
      });
      break;
    case "ACTION_EXECUTION_SUCCESS":
      yield put({
        type: "DEBUGGER_UPDATE_ERROR_LOG",
        payload: {
          ...payload,
          state: {},
        },
      });
      break;
  }

  yield put(debuggerLog(payload));
}

export default function* debuggerSagasListeners() {
  yield all([takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga)]);
}

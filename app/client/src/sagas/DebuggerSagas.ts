import { debuggerLog, errorLog, updateErrorLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetTypes } from "constants/WidgetConstants";
import { LogActionPayload, LOG_TYPE } from "entities/AppsmithConsole";
import { all, put, takeEvery, select, fork } from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isEmpty, get } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { getAction } from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";

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
    const widgetErrorLog = errors[`${source.id}-${propertyPath}`];
    if (!widgetErrorLog) return;

    const noError = isEmpty(validationMessage);

    if (noError && widgetErrorLog.state[propertyPath]) {
      delete widgetErrorLog.state[propertyPath];

      yield put(updateErrorLog(widgetErrorLog));
    }
  }
}

function* formatActionRequestSaga(payload: LogActionPayload) {
  if (!payload.source) return;
  const source = payload.source;

  if (payload.state) {
    const action: Action = yield select(getAction, source.id);
    if (action.pluginType === PluginType.API) {
      let formattedHeaders = [];

      const headers = get(payload, "state.request.headers", {});
      // Convert headers from Record<string, array>[] to Record<string, string>[]
      // for showing in the logs
      formattedHeaders = Object.keys(headers).map((key: string) => {
        const value = headers[key];
        return {
          [key]: value[0],
        };
      });

      yield put(
        debuggerLog({
          ...payload,
          state: {
            ...payload.state,
            request: {
              ...payload.state.request,
              headers: formattedHeaders,
            },
          },
        }),
      );
    } else {
      yield put(debuggerLog(payload));
    }
  } else {
    yield put(debuggerLog(payload));
  }
}

function* debuggerLogSaga(action: ReduxAction<LogActionPayload>) {
  const { payload } = action;

  switch (payload.logType) {
    case LOG_TYPE.WIDGET_UPDATE:
      yield fork(onWidgetUpdateSaga, payload);
      yield put(debuggerLog(payload));
      return;
    case LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR:
      if (payload.source && payload.source.propertyPath) {
        if (payload.text) {
          const pattern = `${payload.source.propertyPath}: `;
          const text = payload.text.replace(pattern, "");

          yield put(
            errorLog({
              ...payload,
              text,
              state: {
                [payload.source.propertyPath]: text,
              },
            }),
          );
        }
      }
      yield put(debuggerLog(payload));
      break;
    case LOG_TYPE.ACTION_EXECUTION_ERROR:
      yield fork(formatActionRequestSaga, payload);
      yield put(errorLog(payload));
      break;
    case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
      yield fork(formatActionRequestSaga, payload);
      yield put(
        updateErrorLog({
          ...payload,
          state: {},
        }),
      );
      break;
    default:
      yield put(debuggerLog(payload));
  }
}

export default function* debuggerSagasListeners() {
  yield all([takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga)]);
}

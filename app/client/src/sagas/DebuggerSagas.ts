import { debuggerLog, errorLog, updateErrorLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetTypes } from "constants/WidgetConstants";
import { LogActionPayload, LOG_TYPE } from "entities/AppsmithConsole";
import {
  all,
  put,
  takeEvery,
  select,
  fork,
  join,
  delay,
} from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isEmpty, set } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { getAction } from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";

function* onWidgetUpdateSaga(payload: LogActionPayload) {
  if (!payload.source) return;

  // Wait for data tree update
  yield delay(1000);
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

function* formatActionRequestSaga(payload: LogActionPayload, request?: any) {
  if (!payload.source || !payload.state || !request || !request.headers) {
    return;
  }

  const headers = request.headers;

  const source = payload.source;
  const action: Action = yield select(getAction, source.id);
  if (action.pluginType === PluginType.API) {
    let formattedHeaders = [];

    // Convert headers from Record<string, array>[] to Record<string, string>[]
    // for showing in the logs
    formattedHeaders = Object.keys(headers).map((key: string) => {
      const value = headers[key];
      return {
        [key]: value[0],
      };
    });

    return formattedHeaders;
  } else {
    return;
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
          yield put(
            debuggerLog({
              ...payload,
              text,
              state: {
                [payload.source.propertyPath]: text,
              },
            }),
          );
        }
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_ERROR:
      {
        const task = yield fork(
          formatActionRequestSaga,
          payload,
          payload.state,
        );
        const res = yield join(task);

        if (res) {
          const log = { ...payload };
          set(log, "state.headers", res);

          yield put(
            errorLog({
              ...log,
              text: payload.message ? payload.message : payload.text,
              message: undefined,
            }),
          );
          yield put(debuggerLog(log));
        } else {
          yield put(
            errorLog({
              ...payload,
              text: payload.message ? payload.message : payload.text,
              message: undefined,
            }),
          );
          yield put(debuggerLog(payload));
        }
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
      {
        const task = yield fork(
          formatActionRequestSaga,
          payload,
          payload.state?.request ?? {},
        );
        const res = yield join(task);
        yield put(
          updateErrorLog({
            ...payload,
            state: {},
          }),
        );

        if (res) {
          const log = { ...payload };
          set(log, "state.request.headers", res);
          yield put(debuggerLog(log));
        } else {
          yield put(debuggerLog(payload));
        }
      }
      break;
    default:
      yield put(debuggerLog(payload));
  }
}

export default function* debuggerSagasListeners() {
  yield all([takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga)]);
}

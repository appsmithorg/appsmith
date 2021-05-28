import { debuggerLog, errorLog, updateErrorLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetTypes } from "constants/WidgetConstants";
import { LogActionPayload, Message } from "entities/AppsmithConsole";
import {
  all,
  put,
  takeEvery,
  select,
  take,
  fork,
  call,
} from "redux-saga/effects";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isEmpty, set, get } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { getAction } from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { isWidget } from "workers/evaluationUtils";
import { getWidget } from "./selectors";
import { WidgetProps } from "widgets/BaseWidget";

function* onWidgetUpdateSaga(payload: LogActionPayload) {
  if (!payload.source) return;
  // Wait for data tree update
  yield take(ReduxActionTypes.SET_EVALUATED_TREE);
  const dataTree: DataTree = yield select(getDataTree);
  const widget = dataTree[payload.source.name];

  if (
    !isWidget(widget) ||
    !widget.validationMessages ||
    !widget.jsErrorMessages
  )
    return;

  // Ignore canvas widget updates
  if (widget.type === WidgetTypes.CANVAS_WIDGET) {
    return;
  }
  const source = payload.source;

  // If widget properties no longer have validation errors update the same
  if (payload.state) {
    const propertyPath = Object.keys(payload.state)[0];

    const validationMessages = widget.validationMessages;
    const validationMessage = validationMessages[propertyPath];
    const jsErrorMessages = widget.jsErrorMessages;
    const jsErrorMessage = jsErrorMessages[propertyPath];
    const errors = yield select(getDebuggerErrors);
    const errorId = `${source.id}-${propertyPath}`;
    const widgetErrorLog = errors[errorId];
    if (!widgetErrorLog) return;

    const noError = isEmpty(validationMessage);
    const noJsError = isEmpty(jsErrorMessage);

    if (noError && noJsError) {
      delete errors[errorId];

      yield put({
        type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS,
        payload: errors,
      });
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

function* onEntityDeleteSaga(payload: Message) {
  const source = payload.source;

  if (!source) {
    yield put(debuggerLog(payload));
    return;
  }

  const errors = yield select(getDebuggerErrors);
  const errorIds = Object.keys(errors);
  const updatedErrors: any = {};

  errorIds.map((e) => {
    const includes = e.includes(source.id);

    if (!includes) {
      updatedErrors[e] = errors[e];
    }
  });

  yield put({
    type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS,
    payload: updatedErrors,
  });
  yield put(debuggerLog(payload));
}

function* debuggerLogSaga(action: ReduxAction<Message>) {
  const { payload } = action;

  switch (payload.logType) {
    case LOG_TYPE.WIDGET_UPDATE:
      yield call(onWidgetUpdateSaga, payload);
      yield put(debuggerLog(payload));
      return;
    case LOG_TYPE.EVAL_ERROR:
    case LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR:
      if (payload.source && payload.source.propertyPath) {
        if (payload.text) {
          yield put(errorLog(payload));

          yield put(debuggerLog(payload));
        }
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_ERROR:
      {
        const res = yield call(formatActionRequestSaga, payload, payload.state);
        const log = { ...payload };
        res && set(log, "state.headers", res);
        yield put(errorLog(log));
        yield put(debuggerLog(log));
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
      {
        const res = yield call(
          formatActionRequestSaga,
          payload,
          payload.state?.request ?? {},
        );

        yield put(
          updateErrorLog({
            ...payload,
            state: {},
          }),
        );

        const log = { ...payload };
        res && set(log, "state.request.headers", res);
        yield put(debuggerLog(log));
      }
      break;
    case LOG_TYPE.ENTITY_DELETED:
      yield fork(onEntityDeleteSaga, payload);
      break;
    default:
      yield put(debuggerLog(payload));
  }
}

// Pass through error list once after on page load actions executions are complete
function* onExecutePageActionsCompleteSaga() {
  yield take(ReduxActionTypes.SET_EVALUATED_TREE);

  const dataTree: DataTree = yield select(getDataTree);
  const errors = yield select(getDebuggerErrors);
  const updatedErrors = { ...errors };
  const errorIds = Object.keys(errors);

  for (const id of errorIds) {
    const splits = id.split("-");
    const entityId = splits[0];
    const propertyName = splits[1];
    const widget: WidgetProps | null = yield select(getWidget, entityId);

    if (widget) {
      const dataTreeWidget = dataTree[widget.widgetName] as DataTreeWidget;

      if (!get(dataTreeWidget.invalidProps, propertyName, null)) {
        delete updatedErrors[id];
      }
    }
  }

  yield put({
    type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS,
    payload: updatedErrors,
  });
}

export default function* debuggerSagasListeners() {
  yield all([
    takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga),
    takeEvery(
      ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS_COMPLETE,
      onExecutePageActionsCompleteSaga,
    ),
  ]);
}

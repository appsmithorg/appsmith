import { debuggerLog, errorLog, updateErrorLog } from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  ENTITY_TYPE,
  LogActionPayload,
  Message,
} from "entities/AppsmithConsole";
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { get, set } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { getAction } from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  getDataTree,
  getEvaluationInverseDependencyMap,
} from "selectors/dataTreeSelectors";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "workers/evaluationUtils";
import { getDependencyChain } from "components/editorComponents/Debugger/helpers";
import {
  ACTION_CONFIGURATION_UPDATED,
  createMessage,
  WIDGET_PROPERTIES_UPDATED,
} from "constants/messages";

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

function* logDependentEntityProperties(payload: Message) {
  const { source, state } = payload;
  if (!state || !source) return;

  yield take(ReduxActionTypes.SET_EVALUATED_TREE);
  const dataTree: DataTree = yield select(getDataTree);

  const propertyPath = `${source.name}.` + payload.source?.propertyPath;
  const inverseDependencyMap = yield select(getEvaluationInverseDependencyMap);
  const finalValue = getDependencyChain(propertyPath, inverseDependencyMap);

  yield all(
    finalValue.map((path) => {
      const entityInfo = getEntityNameAndPropertyPath(path);
      const entity = dataTree[entityInfo.entityName];
      let log = {
        ...payload,
        state: {
          [entityInfo.propertyPath]: get(dataTree, path),
        },
      };

      if (isAction(entity)) {
        log = {
          ...log,
          text: createMessage(ACTION_CONFIGURATION_UPDATED),
          source: {
            type: ENTITY_TYPE.ACTION,
            name: entityInfo.entityName,
            id: entity.actionId,
          },
        };
      } else if (isWidget(entity)) {
        log = {
          ...log,
          text: createMessage(WIDGET_PROPERTIES_UPDATED),
          source: {
            type: ENTITY_TYPE.WIDGET,
            name: entityInfo.entityName,
            id: entity.widgetId,
          },
        };
      }

      return put(debuggerLog(log));
    }),
  );
}

function* debuggerLogSaga(action: ReduxAction<Message>) {
  const { payload } = action;

  switch (payload.logType) {
    case LOG_TYPE.WIDGET_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      return;
    case LOG_TYPE.ACTION_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
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

export default function* debuggerSagasListeners() {
  yield all([takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga)]);
}

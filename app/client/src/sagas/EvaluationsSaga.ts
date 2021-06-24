import {
  actionChannel,
  call,
  fork,
  put,
  select,
  take,
} from "redux-saga/effects";

import {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import WidgetFactory, { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import { GracefulWorkerService } from "utils/WorkerUtil";
import Worker from "worker-loader!../workers/evaluation.worker";
import {
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  PropertyEvalErrorTypeDebugMessage,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import log from "loglevel";
import { WidgetProps } from "widgets/BaseWidget";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "../utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { Action } from "redux";
import _ from "lodash";
import { ENTITY_TYPE, Message } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { AppState } from "reducers";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "workers/evaluationUtils";
import moment from "moment/moment";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import AppsmithConsole from "utils/AppsmithConsole";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  ERROR_EVAL_ERROR_GENERIC,
  ERROR_EVAL_TRIGGER,
} from "constants/messages";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "reducers/entityReducers/appReducer";

let widgetTypeConfigMap: WidgetTypeConfigMap;

const worker = new GracefulWorkerService(Worker);

const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;

function getLatestEvalPropertyErrors(
  currentDebuggerErrors: Record<string, Message>,
  dataTree: DataTree,
  evaluationOrder: Array<string>,
) {
  const updatedDebuggerErrors: Record<string, Message> = {
    ...currentDebuggerErrors,
  };

  for (const evaluatedPath of evaluationOrder) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      evaluatedPath,
    );
    const entity = dataTree[entityName];
    if (isWidget(entity) || isAction(entity)) {
      if (propertyPath in entity.logBlackList) {
        continue;
      }
      const allEvalErrors: EvaluationError[] = _.get(
        entity,
        getEvalErrorPath(evaluatedPath, false),
        [],
      );
      const evaluatedValue = _.get(
        entity,
        getEvalValuePath(evaluatedPath, false),
      );
      const evalErrors = allEvalErrors.filter(
        (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
      );
      const idField = isWidget(entity) ? entity.widgetId : entity.actionId;
      const nameField = isWidget(entity) ? entity.widgetName : entity.name;
      const entityType = isWidget(entity)
        ? ENTITY_TYPE.WIDGET
        : ENTITY_TYPE.ACTION;
      const debuggerKey = idField + "-" + propertyPath;
      // if dataTree has error but debugger does not -> add
      // if debugger has error and data tree has error -> update error
      // if debugger has error but data tree does not -> remove
      // if debugger or data tree does not have an error -> no change

      if (evalErrors.length) {
        // TODO Rank and set the most critical error
        const error = evalErrors[0];
        const errorMessages = evalErrors.map((e) => ({
          message: e.errorMessage,
        }));

        // Add or update
        updatedDebuggerErrors[debuggerKey] = {
          logType: LOG_TYPE.EVAL_ERROR,
          text: PropertyEvalErrorTypeDebugMessage[error.errorType](
            propertyPath,
          ),
          messages: errorMessages,
          severity: error.severity,
          timestamp: moment().format("hh:mm:ss"),
          source: {
            id: idField,
            name: nameField,
            type: entityType,
            propertyPath: propertyPath,
          },
          state: {
            [propertyPath]: evaluatedValue,
          },
        };
      } else if (debuggerKey in updatedDebuggerErrors) {
        // Remove
        delete updatedDebuggerErrors[debuggerKey];
      }
    }
  }
  return updatedDebuggerErrors;
}

function* evalErrorHandler(
  errors: EvalError[],
  dataTree?: DataTree,
  evaluationOrder?: Array<string>,
): any {
  if (dataTree && evaluationOrder) {
    const currentDebuggerErrors: Record<string, Message> = yield select(
      getDebuggerErrors,
    );
    const evalPropertyErrors = getLatestEvalPropertyErrors(
      currentDebuggerErrors,
      dataTree,
      evaluationOrder,
    );

    yield put({
      type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS,
      payload: evalPropertyErrors,
    });
  }

  errors.forEach((error) => {
    switch (error.type) {
      case EvalErrorTypes.CYCLICAL_DEPENDENCY_ERROR: {
        if (error.context) {
          // Add more info about node for the toast
          const { entityType, node } = error.context;
          Toaster.show({
            text: `${error.message} Node was: ${node}`,
            variant: Variant.danger,
          });
          AppsmithConsole.error({
            text: `${error.message} Node was: ${node}`,
          });
          // Send the generic error message to sentry for better grouping
          Sentry.captureException(new Error(error.message), {
            tags: {
              node,
              entityType,
            },
            // Level is warning because it could be a user error
            level: Sentry.Severity.Warning,
          });
          // Log an analytics event for cyclical dep errors
          AnalyticsUtil.logEvent("CYCLICAL_DEPENDENCY_ERROR", {
            node,
            entityType,
            // Level is warning because it could be a user error
            level: Sentry.Severity.Warning,
          });
        }

        break;
      }
      case EvalErrorTypes.EVAL_TREE_ERROR: {
        Toaster.show({
          text: createMessage(ERROR_EVAL_ERROR_GENERIC),
          variant: Variant.danger,
        });
        break;
      }
      case EvalErrorTypes.BAD_UNEVAL_TREE_ERROR: {
        Sentry.captureException(error);
        break;
      }
      case EvalErrorTypes.EVAL_TRIGGER_ERROR: {
        log.debug(error);
        Toaster.show({
          text: createMessage(ERROR_EVAL_TRIGGER, error.message),
          variant: Variant.danger,
          showDebugButton: true,
        });
        AppsmithConsole.error({
          text: createMessage(ERROR_EVAL_TRIGGER, error.message),
        });
        break;
      }
      case EvalErrorTypes.EVAL_PROPERTY_ERROR: {
        log.debug(error);
        break;
      }
      default: {
        Sentry.captureException(error);
        log.debug(error);
      }
    }
  });
}

function* logSuccessfulBindings(
  unEvalTree: DataTree,
  dataTree: DataTree,
  evaluationOrder: string[],
) {
  const appMode = yield select(getAppMode);
  if (appMode === APP_MODE.PUBLISHED) return;
  if (!evaluationOrder) return;
  evaluationOrder.forEach((evaluatedPath) => {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      evaluatedPath,
    );
    const entity = dataTree[entityName];
    if (isAction(entity) || isWidget(entity)) {
      const unevalValue = _.get(unEvalTree, evaluatedPath);
      const entityType = isAction(entity) ? entity.pluginType : entity.type;
      const isABinding = _.find(entity.dynamicBindingPathList, {
        key: propertyPath,
      });
      const logBlackList = entity.logBlackList;
      const errors: EvaluationError[] = _.get(
        dataTree,
        getEvalErrorPath(evaluatedPath),
        [],
      ) as EvaluationError[];
      const criticalErrors = errors.filter(
        (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
      );
      const hasErrors = criticalErrors.length > 0;

      if (isABinding && !hasErrors && !(propertyPath in logBlackList)) {
        AnalyticsUtil.logEvent("BINDING_SUCCESS", {
          unevalValue,
          entityType,
          propertyPath,
        });
      }
    }
  });
}

function* postEvalActionDispatcher(
  actions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
) {
  for (const action of actions) {
    yield put(action);
  }
}

function* evaluateTreeSaga(
  postEvalActions?: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
) {
  const unevalTree = yield select(getUnevaluatedDataTree);
  log.debug({ unevalTree });
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  const workerResponse = yield call(
    worker.request,
    EVAL_WORKER_ACTIONS.EVAL_TREE,
    {
      unevalTree,
      widgetTypeConfigMap,
    },
  );
  const {
    dataTree,
    dependencies,
    errors,
    evaluationOrder,
    logs,
  } = workerResponse;
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  log.debug({ dataTree: dataTree });
  logs.forEach((evalLog: any) => log.debug(evalLog));
  yield call(evalErrorHandler, errors, dataTree, evaluationOrder);
  yield fork(logSuccessfulBindings, unevalTree, dataTree, evaluationOrder);

  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: dataTree,
  });
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );
  yield put({
    type: ReduxActionTypes.SET_EVALUATION_INVERSE_DEPENDENCY_MAP,
    payload: { inverseDependencyMap: dependencies },
  });
  if (postEvalActions && postEvalActions.length) {
    yield call(postEvalActionDispatcher, postEvalActions);
  }
}

export function* evaluateActionBindings(
  bindings: string[],
  executionParams: Record<string, any> | string = {},
) {
  const workerResponse = yield call(
    worker.request,
    EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS,
    {
      bindings,
      executionParams,
    },
  );

  const { errors, values } = workerResponse;

  yield call(evalErrorHandler, errors);
  return values;
}

export function* evaluateDynamicTrigger(
  dynamicTrigger: string,
  callbackData?: Array<any>,
) {
  const unEvalTree = yield select(getUnevaluatedDataTree);

  const workerResponse = yield call(
    worker.request,
    EVAL_WORKER_ACTIONS.EVAL_TRIGGER,
    { dataTree: unEvalTree, dynamicTrigger, callbackData },
  );

  const { errors, triggers } = workerResponse;
  yield call(evalErrorHandler, errors);
  return triggers;
}

export function* clearEvalCache() {
  yield call(worker.request, EVAL_WORKER_ACTIONS.CLEAR_CACHE);

  return true;
}

export function* clearEvalPropertyCache(propertyPath: string) {
  yield call(worker.request, EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE, {
    propertyPath,
  });
}

/**
 * clears all cache keys of a widget
 *
 * @param widgetName
 */
export function* clearEvalPropertyCacheOfWidget(widgetName: string) {
  yield call(
    worker.request,
    EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE_OF_WIDGET,
    {
      widgetName,
    },
  );
}

export function* validateProperty(
  property: string,
  value: any,
  props: WidgetProps,
) {
  const unevalTree = yield select(getUnevaluatedDataTree);
  const validation = unevalTree[props.widgetName].validationPaths[property];
  return yield call(worker.request, EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY, {
    property,
    value,
    props,
    validation,
  });
}

const FIRST_EVAL_REDUX_ACTIONS = [
  // Pages
  ReduxActionTypes.FETCH_PAGE_SUCCESS,
  ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
];

const EVALUATE_REDUX_ACTIONS = [
  ...FIRST_EVAL_REDUX_ACTIONS,
  // Actions
  ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
  ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS,
  ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
  ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
  ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
  ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
  ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
  ReduxActionTypes.CREATE_ACTION_SUCCESS,
  ReduxActionTypes.UPDATE_ACTION_PROPERTY,
  ReduxActionTypes.DELETE_ACTION_SUCCESS,
  ReduxActionTypes.COPY_ACTION_SUCCESS,
  ReduxActionTypes.MOVE_ACTION_SUCCESS,
  ReduxActionTypes.RUN_ACTION_SUCCESS,
  ReduxActionErrorTypes.RUN_ACTION_ERROR,
  ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS,
  ReduxActionErrorTypes.EXECUTE_ACTION_ERROR,
  // App Data
  ReduxActionTypes.SET_APP_MODE,
  ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
  ReduxActionTypes.UPDATE_APP_PERSISTENT_STORE,
  ReduxActionTypes.UPDATE_APP_TRANSIENT_STORE,
  // Widgets
  ReduxActionTypes.UPDATE_LAYOUT,
  ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
  ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS,
  // Widget Meta
  ReduxActionTypes.SET_META_PROP,
  ReduxActionTypes.RESET_WIDGET_META,
  // Batches
  ReduxActionTypes.BATCH_UPDATES_SUCCESS,
];

const shouldProcessAction = (action: ReduxAction<unknown>) => {
  if (
    action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
    Array.isArray(action.payload)
  ) {
    const batchedActionTypes = action.payload.map(
      (batchedAction) => batchedAction.type,
    );
    return (
      _.intersection(EVALUATE_REDUX_ACTIONS, batchedActionTypes).length > 0
    );
  }
  return true;
};

function evalQueueBuffer() {
  let canTake = false;
  let postEvalActions: any = [];
  const take = () => {
    if (canTake) {
      const resp = postEvalActions;
      postEvalActions = [];
      canTake = false;
      return { postEvalActions: resp, type: "BUFFERED_ACTION" };
    }
  };
  const flush = () => {
    if (canTake) {
      return [take() as Action];
    }

    return [];
  };

  const put = (action: EvaluationReduxAction<unknown | unknown[]>) => {
    if (!shouldProcessAction(action)) {
      return;
    }
    canTake = true;

    // TODO: If the action is the same as before, we can send only one and ignore duplicates.
    if (action.postEvalActions) {
      postEvalActions.push(...action.postEvalActions);
    }
  };

  return {
    take,
    put,
    isEmpty: () => {
      return !canTake;
    },
    flush,
  };
}

function* evaluationChangeListenerSaga() {
  // Explicitly shutdown old worker if present
  yield call(worker.shutdown);
  yield call(worker.start);
  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  const initAction = yield take(FIRST_EVAL_REDUX_ACTIONS);
  yield fork(evaluateTreeSaga, initAction.postEvalActions);
  const evtActionChannel = yield actionChannel(
    EVALUATE_REDUX_ACTIONS,
    evalQueueBuffer(),
  );
  while (true) {
    const action: EvaluationReduxAction<unknown | unknown[]> = yield take(
      evtActionChannel,
    );
    if (shouldProcessAction(action)) {
      yield call(evaluateTreeSaga, action.postEvalActions);
    }
  }
  // TODO(hetu) need an action to stop listening and evaluate (exit app)
}

export default function* evaluationSagaListeners() {
  yield take(ReduxActionTypes.START_EVALUATION);
  while (true) {
    try {
      yield call(evaluationChangeListenerSaga);
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
    }
  }
}

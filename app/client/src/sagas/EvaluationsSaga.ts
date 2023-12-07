import type { ActionPattern, CallEffect, ForkEffect } from "redux-saga/effects";
import {
  actionChannel,
  all,
  call,
  delay,
  fork,
  put,
  select,
  spawn,
  take,
} from "redux-saga/effects";

import type {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionType,
  AnyReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getDataTree,
  getUnevaluatedDataTree,
} from "selectors/dataTreeSelectors";
import { getMetaWidgets, getWidgets } from "sagas/selectors";
import type { WidgetTypeConfigMap } from "WidgetProvider/factory";
import WidgetFactory from "WidgetProvider/factory";
import { GracefulWorkerService } from "utils/WorkerUtil";
import type { EvalError, EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import log from "loglevel";
import type { WidgetProps } from "widgets/BaseWidget";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import type { Action } from "redux";
import {
  EVAL_AND_LINT_REDUX_ACTIONS,
  FIRST_EVAL_REDUX_ACTIONS,
  getRequiresLinting,
} from "@appsmith/actions/evaluationActionsList";
import {
  setDependencyMap,
  setEvaluatedTree,
  shouldForceEval,
  shouldLog,
  shouldProcessAction,
  shouldTriggerEvaluation,
} from "actions/evaluationActions";
import ConfigTreeActions from "utils/configTree";
import {
  dynamicTriggerErrorHandler,
  handleJSFunctionExecutionErrorLog,
  logJSVarCreatedEvent,
  logSuccessfulBindings,
  postEvalActionDispatcher,
  updateTernDefinitions,
} from "./PostEvaluationSagas";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { get, isEmpty } from "lodash";
import type { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import { executeActionTriggers } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import {
  EventType,
  TriggerKind,
} from "constants/AppsmithActionConstants/ActionConstants";
import { validate } from "workers/Evaluation/validations";
import { REPLAY_DELAY } from "entities/Replay/replayUtils";
import type { EvaluationVersion } from "@appsmith/api/ApplicationApi";

import type { LogObject } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import type { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";
import type { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import type { FormEvalActionPayload } from "./FormEvaluationSaga";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { resetWidgetsMetaState, updateMetaState } from "actions/metaActions";
import {
  getAllActionValidationConfig,
  getAllJSActionsData,
} from "@appsmith/selectors/entitiesSelector";
import type { WidgetEntityConfig } from "@appsmith/entities/DataTree/types";
import type { DataTree, UnEvalTree } from "entities/DataTree/dataTreeTypes";
import { initiateLinting, lintWorker } from "./LintingSagas";
import type {
  EvalTreeRequestData,
  EvalTreeResponseData,
} from "workers/Evaluation/types";
import type { ActionDescription } from "@appsmith/workers/Evaluation/fns";
import { handleEvalWorkerRequestSaga } from "./EvalWorkerActionSagas";
import { getAppsmithConfigs } from "@appsmith/configs";
import { executeJSUpdates } from "actions/pluginActionActions";
import { setEvaluatedActionSelectorField } from "actions/actionSelectorActions";
import { waitForWidgetConfigBuild } from "./InitSagas";
import { logDynamicTriggerExecution } from "@appsmith/sagas/analyticsSaga";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { fetchFeatureFlagsInit } from "actions/userActions";
import { parseUpdatesAndDeleteUndefinedUpdates } from "./EvaluationSaga.utils";
import { getFeatureFlagsFetched } from "selectors/usersSelectors";
import { getIsCurrentEditorWorkflowType } from "@appsmith/selectors/workflowSelectors";
import { evalErrorHandler } from "./EvalErrorHandler";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { endSpan, startRootSpan } from "UITelemetry/generateTraces";

const APPSMITH_CONFIGS = getAppsmithConfigs();
export const evalWorker = new GracefulWorkerService(
  new Worker(
    new URL("../workers/Evaluation/evaluation.worker.ts", import.meta.url),
    {
      type: "module",
      // Note: the `Worker` part of the name is slightly important – LinkRelPreload_spec.js
      // relies on it to find workers in the list of all requests.
      name: "evalWorker",
    },
  ),
);

let widgetTypeConfigMap: WidgetTypeConfigMap;

export function* updateDataTreeHandler(
  data: {
    evalTreeResponse: EvalTreeResponseData;
    unevalTree: UnEvalTree;
    requiresLogging: boolean;
  },
  postEvalActions?: Array<AnyReduxAction>,
) {
  const { evalTreeResponse, requiresLogging, unevalTree } = data;
  const postEvalActionsToDispatch: Array<AnyReduxAction> =
    postEvalActions || [];

  const {
    configTree,
    dependencies,
    errors,
    evalMetaUpdates = [],
    evaluationOrder,
    isCreateFirstTree = false,
    isNewWidgetAdded,
    jsUpdates,
    jsVarsCreatedEvent,
    logs,
    removedPaths,
    staleMetaIds,
    undefinedEvalValuesMap,
    unEvalUpdates,
    updates,
  } = evalTreeResponse;

  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);

  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );

  if (!isEmpty(staleMetaIds)) {
    yield put(resetWidgetsMetaState(staleMetaIds));
  }
  const parsedUpdates = parseUpdatesAndDeleteUndefinedUpdates(updates);
  yield put(setEvaluatedTree(parsedUpdates));

  ConfigTreeActions.setConfigTree(configTree);

  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );

  // if evalMetaUpdates are present only then dispatch updateMetaState
  if (evalMetaUpdates.length) {
    yield put(updateMetaState(evalMetaUpdates));
  }
  log.debug({ evalMetaUpdatesLength: evalMetaUpdates.length });

  const updatedDataTree: DataTree = yield select(getDataTree);

  log.debug({ jsUpdates: jsUpdates });
  log.debug({ dataTree: updatedDataTree });
  logs?.forEach((evalLog: any) => log.debug(evalLog));

  yield call(
    evalErrorHandler,
    errors,
    updatedDataTree,
    evaluationOrder,
    configTree,
    removedPaths,
  );
  AnalyticsUtil.setBlockErrorLogs(isCreateFirstTree);
  if (appMode !== APP_MODE.PUBLISHED) {
    const jsData: Record<string, unknown> = yield select(getAllJSActionsData);
    postEvalActionsToDispatch.push(executeJSUpdates(jsUpdates));

    if (requiresLogging) {
      yield fork(
        logSuccessfulBindings,
        unevalTree,
        updatedDataTree,
        evaluationOrder,
        isCreateFirstTree,
        isNewWidgetAdded,
        configTree,
        undefinedEvalValuesMap,
      );
    }

    yield fork(
      updateTernDefinitions,
      updatedDataTree,
      configTree,
      unEvalUpdates,
      isCreateFirstTree,
      jsData,
    );
  }

  yield put(setDependencyMap(dependencies));
  if (postEvalActionsToDispatch && postEvalActionsToDispatch.length) {
    yield call(postEvalActionDispatcher, postEvalActionsToDispatch);
  }

  yield call(logJSVarCreatedEvent, jsVarsCreatedEvent);
}

/**
 * This saga is responsible for evaluating the data tree
 * @param postEvalActions
 * @param shouldReplay
 * @param requiresLinting
 * @param forceEvaluation - if true, will re-evaluate the entire tree
 * @returns
 * @example
 * yield call(evaluateTreeSaga, postEvalActions, shouldReplay, requiresLinting, forceEvaluation)
 */
export function* evaluateTreeSaga(
  unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree>,
  postEvalActions?: Array<AnyReduxAction>,
  shouldReplay = true,
  forceEvaluation = false,
  requiresLogging = false,
) {
  const allActionValidationConfig: ReturnType<
    typeof getAllActionValidationConfig
  > = yield select(getAllActionValidationConfig);
  const unevalTree = unEvalAndConfigTree.unEvalTree;
  const widgets: ReturnType<typeof getWidgets> = yield select(getWidgets);
  const metaWidgets: ReturnType<typeof getMetaWidgets> =
    yield select(getMetaWidgets);
  const theme: ReturnType<typeof getSelectedAppTheme> =
    yield select(getSelectedAppTheme);
  const toPrintConfigTree = unEvalAndConfigTree.configTree;
  log.debug({ unevalTree, configTree: toPrintConfigTree });
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);

  const evalTreeRequestData: EvalTreeRequestData = {
    unevalTree: unEvalAndConfigTree,
    widgetTypeConfigMap,
    widgets,
    theme,
    shouldReplay,
    allActionValidationConfig,
    forceEvaluation,
    metaWidgets,
    appMode,
  };

  const workerResponse: EvalTreeResponseData = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_TREE,
    evalTreeRequestData,
  );

  yield call(
    updateDataTreeHandler,
    { evalTreeResponse: workerResponse, unevalTree, requiresLogging },
    postEvalActions,
  );
}

export function* evaluateActionBindings(
  bindings: string[],
  executionParams: Record<string, any> | string = {},
) {
  const span = startRootSpan("evaluateActionBindings");
  const workerResponse: { errors: EvalError[]; values: unknown } = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS,
    {
      bindings,
      executionParams,
    },
  );

  const { errors, values } = workerResponse;

  yield call(evalErrorHandler, errors);
  endSpan(span);
  return values;
}

export function* evaluateAndExecuteDynamicTrigger(
  dynamicTrigger: string,
  eventType: EventType,
  triggerMeta: TriggerMeta,
  callbackData?: Array<any>,
  globalContext?: Record<string, unknown>,
) {
  const unEvalTree: ReturnType<typeof getUnevaluatedDataTree> = yield select(
    getUnevaluatedDataTree,
  );
  log.debug({ execute: dynamicTrigger });
  const response: { errors: EvaluationError[]; result: unknown } = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_TRIGGER,
    {
      unEvalTree,
      dynamicTrigger,
      callbackData,
      globalContext,
      eventType,
      triggerMeta,
    },
  );
  const { errors = [] } = response as any;
  yield call(dynamicTriggerErrorHandler, errors);
  yield fork(logDynamicTriggerExecution, {
    dynamicTrigger,
    errors,
    triggerMeta,
  });
  return response;
}

export interface ResponsePayload {
  data: {
    reason?: string;
    resolve?: unknown;
  };
  success: boolean;
}

/*
 * It is necessary to respond back as the worker is waiting with a pending promise and wanting to know if it should
 * resolve or reject it with the data the execution has provided
 */
export function* executeTriggerRequestSaga(
  trigger: ActionDescription,
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const responsePayload = {
    data: null,
    error: null,
  };
  try {
    responsePayload.data = yield call(
      executeActionTriggers,
      trigger,
      eventType,
      triggerMeta,
    );
  } catch (error) {
    // When error occurs in execution of triggers,
    // a success: false is sent to reject the promise
    // @ts-expect-error: reason is of type string
    responsePayload.error = {
      // @ts-expect-error: reason is of type string
      message: error.responseData?.[0] || error.message,
    };
  }
  return responsePayload;
}

export function* clearEvalCache() {
  /**
   * Reset cache in worker before resetting the dataTree
   * This order is important because there could be pending evaluation requests that are being processed by the worker
   * The diffs generated by the already queued eval request when applied to a reset data tree will cause unexpected crash.
   */
  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.CLEAR_CACHE);
  yield put({ type: ReduxActionTypes.RESET_DATA_TREE });
  return true;
}

interface JSFunctionExecutionResponse {
  errors: unknown[];
  result: unknown;
  logs?: LogObject[];
}

function* executeAsyncJSFunction(action: JSAction, collection: JSCollection) {
  const { id: collectionId, name: collectionName } = collection;
  const functionCall = `${collectionName}.${action.name}()`;
  const triggerMeta = {
    source: {
      id: collectionId,
      name: `${collectionName}.${action.name}`,
      type: ENTITY_TYPE.JSACTION,
    },
    triggerPropertyName: `${collectionName}.${action.name}`,
    triggerKind: TriggerKind.JS_FUNCTION_EXECUTION,
  };
  const eventType = EventType.ON_JS_FUNCTION_EXECUTE;
  const response: JSFunctionExecutionResponse = yield call(
    evaluateAndExecuteDynamicTrigger,
    functionCall,
    eventType,
    triggerMeta,
  );
  return response;
}

export function* executeJSFunction(action: JSAction, collection: JSCollection) {
  const response: {
    errors: unknown[];
    result: unknown;
    logs?: LogObject[];
  } = yield call(executeAsyncJSFunction, action, collection);
  const { errors, result } = response;
  const isDirty = !!errors.length;

  // After every function execution, log execution errors if present
  yield call(handleJSFunctionExecutionErrorLog, action, collection, errors);
  return { result, isDirty };
}

export function* validateProperty(
  property: string,
  value: any,
  props: WidgetProps,
) {
  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield select(getUnevaluatedDataTree);
  const configTree = unEvalAndConfigTree.configTree;
  const entityConfig = configTree[props.widgetName] as WidgetEntityConfig;
  const validation = entityConfig?.validationPaths[property];
  const response: unknown = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY,
    {
      property,
      value,
      props,
      validation,
    },
  );
  return response;
}

function evalQueueBuffer() {
  let canTake = false;
  let collectedPostEvalActions: any = [];
  const take = () => {
    if (canTake) {
      const resp = collectedPostEvalActions;
      collectedPostEvalActions = [];
      canTake = false;
      return { postEvalActions: resp, type: ReduxActionTypes.BUFFERED_ACTION };
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

    const postEvalActions = getPostEvalActions(action);
    collectedPostEvalActions.push(...postEvalActions);
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

/**
 * Extract the post eval actions from an evaluation action
 * Batched actions have post eval actions inside them, extract that
 *
 * **/
function getPostEvalActions(
  action: EvaluationReduxAction<unknown | unknown[]>,
): AnyReduxAction[] {
  const postEvalActions: AnyReduxAction[] = [];
  if (action.postEvalActions) {
    postEvalActions.push(...action.postEvalActions);
  }
  if (
    action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
    Array.isArray(action.payload)
  ) {
    action.payload.forEach((batchedAction) => {
      if (batchedAction.postEvalActions) {
        postEvalActions.push(
          ...(batchedAction.postEvalActions as AnyReduxAction[]),
        );
      }
    });
  }
  return postEvalActions;
}

function* evalAndLintingHandler(
  isBlockingCall = true,
  action: ReduxAction<unknown>,
  options: Partial<{
    shouldReplay: boolean;
    forceEvaluation: boolean;
    requiresLogging: boolean;
  }>,
) {
  const span = startRootSpan("evalAndLintingHandler");
  const { forceEvaluation, requiresLogging, shouldReplay } = options;

  const requiresLinting = getRequiresLinting(action);

  const requiresEval = shouldTriggerEvaluation(action);
  log.debug({
    action,
    triggeredLinting: requiresLinting,
    triggeredEvaluation: requiresEval,
  });

  if (!requiresEval && !requiresLinting) {
    endSpan(span);
    return;
  }

  // Generate all the data needed for both eval and linting
  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield select(getUnevaluatedDataTree);
  const postEvalActions = getPostEvalActions(action);
  const fn: (...args: unknown[]) => CallEffect<unknown> | ForkEffect<unknown> =
    isBlockingCall ? call : fork;

  const effects = [];

  if (requiresEval) {
    effects.push(
      fn(
        evaluateTreeSaga,
        unEvalAndConfigTree,
        postEvalActions,
        shouldReplay,
        forceEvaluation,
        requiresLogging,
      ),
    );
  }
  if (requiresLinting) {
    effects.push(fn(initiateLinting, unEvalAndConfigTree, forceEvaluation));
  }

  yield all(effects);
  endSpan(span);
}

function* evaluationChangeListenerSaga(): any {
  // Explicitly shutdown old worker if present
  yield all([call(evalWorker.shutdown), call(lintWorker.shutdown)]);
  const [evalWorkerListenerChannel] = yield all([
    call(evalWorker.start),
    call(lintWorker.start),
  ]);

  const isFFFetched = yield select(getFeatureFlagsFetched);
  if (!isFFFetched) {
    yield call(fetchFeatureFlagsInit);
    yield take(ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS);
  }

  const featureFlags: Record<string, boolean> =
    yield select(selectFeatureFlags);

  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.SETUP, {
    cloudHosting: !!APPSMITH_CONFIGS.cloudHosting,
    featureFlags: featureFlags,
  });
  yield spawn(handleEvalWorkerRequestSaga, evalWorkerListenerChannel);

  const initAction: EvaluationReduxAction<unknown> = yield take(
    FIRST_EVAL_REDUX_ACTIONS,
  );

  // Wait for widget config build to complete before starting evaluation only if the current editor is not a workflow
  const isCurrentEditorWorkflowType = yield select(
    getIsCurrentEditorWorkflowType,
  );

  if (!isCurrentEditorWorkflowType) {
    yield call(waitForWidgetConfigBuild);
  }

  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  yield fork(evalAndLintingHandler, false, initAction, {
    shouldReplay: false,
    forceEvaluation: false,
  });
  const evtActionChannel: ActionPattern<Action<any>> = yield actionChannel(
    EVAL_AND_LINT_REDUX_ACTIONS,
    evalQueueBuffer(),
  );
  while (true) {
    const action: EvaluationReduxAction<unknown | unknown[]> =
      yield take(evtActionChannel);

    yield call(evalAndLintingHandler, true, action, {
      shouldReplay: get(action, "payload.shouldReplay"),
      forceEvaluation: shouldForceEval(action),
      requiresLogging: shouldLog(action),
    });
  }
}

export function* evaluateActionSelectorFieldSaga(action: any) {
  const { id, type, value } = action.payload;
  try {
    const workerResponse: {
      errors: Array<unknown>;
      result: unknown;
    } = yield call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_EXPRESSION, {
      expression: value,
    });
    const lintErrors = (workerResponse.errors || []).filter(
      (error: any) => error.errorType !== PropertyEvaluationErrorType.LINT,
    );
    if (workerResponse.result) {
      const validation = validate({ type }, workerResponse.result, {}, "");
      if (!validation.isValid)
        validation.messages?.map((message) => {
          lintErrors.unshift({
            ...validation,
            ...{
              errorType: PropertyEvaluationErrorType.VALIDATION,
              errorMessage: message,
            },
          });
        });
    }

    yield put(
      setEvaluatedActionSelectorField({
        id,
        evaluatedValue: {
          value: workerResponse.result as string,
          errors: lintErrors,
        },
      }),
    );
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
  }
}

export function* updateReplayEntitySaga(
  actionPayload: ReduxAction<{
    entityId: string;
    entity: Replayable;
    entityType: ENTITY_TYPE;
  }>,
) {
  //Delay updates to replay object to not persist every keystroke
  yield delay(REPLAY_DELAY);
  const { entity, entityId, entityType } = actionPayload.payload;
  const workerResponse: unknown = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.UPDATE_REPLAY_OBJECT,
    {
      entityId,
      entity,
      entityType,
    },
  );

  return workerResponse;
}

export function* workerComputeUndoRedo(operation: string, entityId: string) {
  const workerResponse: unknown = yield call(evalWorker.request, operation, {
    entityId,
  });
  return workerResponse;
}

// Type to represent the state of the evaluation reducer
export interface FormEvaluationConfig
  extends ReduxAction<FormEvalActionPayload> {
  currentEvalState: FormEvaluationState;
}

// Function to trigger the form eval job in the worker
export function* evalFormConfig(formEvaluationConfigObj: FormEvaluationConfig) {
  const workerResponse: unknown = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.INIT_FORM_EVAL,
    formEvaluationConfigObj,
  );

  return workerResponse;
}

export function* setAppVersionOnWorkerSaga(action: {
  type: ReduxActionType;
  payload: EvaluationVersion;
}) {
  const version: EvaluationVersion = action.payload;
  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION, {
    version,
  });
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

export { evalWorker as EvalWorker };

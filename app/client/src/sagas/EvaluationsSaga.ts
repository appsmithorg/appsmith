import type {
  ActionPattern,
  CallEffect,
  Effect,
  ForkEffect,
} from "redux-saga/effects";
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
  join,
} from "redux-saga/effects";

import type {
  ReduxAction,
  ReduxActionType,
  AnyReduxAction,
} from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import {
  getDataTree,
  getUnevaluatedDataTree,
} from "selectors/dataTreeSelectors";
import { getMetaWidgets, getWidgets, getWidgetsMeta } from "sagas/selectors";
import type { WidgetTypeConfigMap } from "WidgetProvider/factory/types";
import WidgetFactory from "WidgetProvider/factory";
import { evalWorker } from "utils/workerInstances";
import type { EvalError, EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { EVAL_WORKER_ACTIONS } from "ee/workers/Evaluation/evalWorkerActions";
import log from "loglevel";
import type { WidgetProps } from "widgets/BaseWidget";
import type { Action } from "redux";
import {
  EVAL_AND_LINT_REDUX_ACTIONS,
  FIRST_EVAL_REDUX_ACTIONS,
  getRequiresLinting,
} from "ee/actions/evaluationActionsList";
import {
  setDependencyMap,
  setEvaluatedTree,
  setIsFirstPageLoad,
  shouldForceEval,
  shouldLog,
  shouldProcessAction,
  shouldTriggerEvaluation,
} from "actions/evaluationActions";
import ConfigTreeActions from "utils/configTree";
import {
  showExecutionErrors,
  handleJSFunctionExecutionErrorLog,
  logJSVarCreatedEvent,
  logSuccessfulBindings,
  postEvalActionDispatcher,
  updateTernDefinitions,
} from "./PostEvaluationSagas";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { get, isEmpty } from "lodash";
import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import { executeActionTriggers } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import {
  EventType,
  TriggerKind,
} from "constants/AppsmithActionConstants/ActionConstants";
import { validate } from "workers/Evaluation/validations";
import { REPLAY_DELAY } from "entities/Replay/replayUtils";
import type { EvaluationVersion } from "constants/EvalConstants";

import type { LogObject } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";
import type { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import type { FormEvalActionPayload } from "./FormEvaluationSaga";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { resetWidgetsMetaState, updateMetaState } from "actions/metaActions";
import {
  getAllActionValidationConfig,
  getAllJSActionsData,
  getCurrentPageDSLVersion,
} from "ee/selectors/entitiesSelector";
import type { WidgetEntityConfig } from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import { initiateLinting, lintWorker } from "./LintingSagas";
import type {
  EvalTreeRequestData,
  EvalTreeResponseData,
} from "workers/Evaluation/types";
import type { ActionDescription } from "ee/workers/Evaluation/fns";
import { handleEvalWorkerRequestSaga } from "./EvalWorkerActionSagas";
import { getAppsmithConfigs } from "ee/configs";
import {
  type actionDataPayload,
  type updateActionDataPayloadType,
} from "actions/pluginActionActions";
import { executeJSUpdates } from "actions/jsPaneActions";
import { setEvaluatedActionSelectorField } from "actions/actionSelectorActions";

import { logDynamicTriggerExecution } from "ee/sagas/analyticsSaga";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { fetchFeatureFlagsInit } from "actions/userActions";
import {
  getAffectedJSObjectIdsFromAction,
  parseUpdatesAndDeleteUndefinedUpdates,
} from "./EvaluationsSagaUtils";
import { getFeatureFlagsFetched } from "selectors/usersSelectors";
import { evalErrorHandler } from "./EvalErrorHandler";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { endSpan, startRootSpan } from "instrumentation/generateTraces";
import { transformTriggerEvalErrors } from "ee/sagas/helpers";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import type {
  AffectedJSObjects,
  EvaluationReduxAction,
} from "actions/EvaluationReduxActionTypes";
import { appsmithTelemetry } from "instrumentation";
import { getUsedWidgetTypes } from "selectors/widgetSelectors";
import type BaseWidget from "widgets/BaseWidget";
import { loadWidget } from "widgets";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { failFastApiCalls } from "./InitSagas";
import { fetchJSLibraries } from "actions/JSLibraryActions";
import type { Task } from "redux-saga";
import { getAllUniqueWidgetTypesInUiModules } from "ee/selectors/moduleInstanceSelectors";
import { clearAllWidgetFactoryCache } from "WidgetProvider/factory/decorators";

const APPSMITH_CONFIGS = getAppsmithConfigs();

let widgetTypeConfigMap: WidgetTypeConfigMap;

// Common worker setup logic
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* setupWorkers(clearCache = false): any {
  // Explicitly shutdown old worker if present
  yield all([call(evalWorker.shutdown), call(lintWorker.shutdown)]);
  const [evalWorkerListenerChannel] = yield all([
    call(evalWorker.start),
    call(lintWorker.start),
  ]);

  if (clearCache) {
    yield call(evalWorker.request, EVAL_WORKER_ACTIONS.CLEAR_CACHE);
  }

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

  return evalWorkerListenerChannel;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* webWorkerSetupSaga(): any {
  const evalWorkerListenerChannel = yield call(setupWorkers);

  yield spawn(handleEvalWorkerRequestSaga, evalWorkerListenerChannel);
}

function* webWorkerSetupSagaWithJSLibraries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeJSLibrariesChannel: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const evalWorkerListenerChannel = yield call(setupWorkers, true);

  // Take the action from the appVi
  const jsLibrariesAction = yield take(initializeJSLibrariesChannel);
  const { applicationId, customJSLibraries } = jsLibrariesAction.payload;

  yield put(setIsFirstPageLoad());

  // Use failFastApiCalls to execute fetchJSLibraries
  const resultOfJSLibrariesCall: boolean = yield call(
    failFastApiCalls,
    [fetchJSLibraries(applicationId, customJSLibraries)],
    [ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS],
    [ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED],
  );

  if (!resultOfJSLibrariesCall) {
    throw new Error("Failed to load JS libraries");
  }

  yield spawn(handleEvalWorkerRequestSaga, evalWorkerListenerChannel);
}

export function* updateDataTreeHandler(
  data: {
    evalTreeResponse: EvalTreeResponseData;
    unevalTree: UnEvalTree;
    requiresLogging: boolean;
    configTree: ConfigTree;
  },
  postEvalActions?: Array<AnyReduxAction>,
) {
  const { configTree, evalTreeResponse, requiresLogging, unevalTree } = data;
  const postEvalActionsToDispatch: Array<AnyReduxAction> =
    postEvalActions || [];

  const {
    dependencies,
    errors,
    evalMetaUpdates = [],
    evaluationOrder,
    executeReactiveActions,
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

  const featureFlags: Record<string, boolean> =
    yield select(selectFeatureFlags);
  const isReactiveActionsEnabled =
    featureFlags.release_reactive_actions_enabled;
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);

  if (!isEmpty(staleMetaIds)) {
    yield put(resetWidgetsMetaState(staleMetaIds));
  }

  const parsedUpdates = parseUpdatesAndDeleteUndefinedUpdates(updates);

  yield put(setEvaluatedTree(parsedUpdates));

  ConfigTreeActions.setConfigTree(configTree);

  // if evalMetaUpdates are present only then dispatch updateMetaState
  if (evalMetaUpdates.length) {
    yield put(updateMetaState(evalMetaUpdates));
  }

  log.debug({ evalMetaUpdatesLength: evalMetaUpdates.length });

  const updatedDataTree: DataTree = yield select(getDataTree);

  log.debug({ jsUpdates: jsUpdates });
  log.debug({ dataTree: updatedDataTree });
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (
    executeReactiveActions &&
    executeReactiveActions.length &&
    isReactiveActionsEnabled
  ) {
    yield put({
      type: ReduxActionTypes.EXECUTE_REACTIVE_QUERIES,
      payload: {
        executeReactiveActions,
        dataTree: updatedDataTree,
        configTree,
      },
    });
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
  affectedJSObjects: AffectedJSObjects = defaultAffectedJSObjects,
  actionDataPayloadConsolidated?: actionDataPayload,
  isFirstEvaluation = false,
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

  log.debug({ unevalTree, configTree: unEvalAndConfigTree.configTree });
  const instanceId: string = yield select(getInstanceId);
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);
  const lastDeployedAt: string = yield select(getApplicationLastDeployedAt);
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
  const widgetsMeta: ReturnType<typeof getWidgetsMeta> =
    yield select(getWidgetsMeta);
  const dslVersion: number | null = yield select(getCurrentPageDSLVersion);

  const shouldRespondWithLogs = log.getLevel() === log.levels.DEBUG;

  const evalTreeRequestData: EvalTreeRequestData = {
    cacheProps: {
      appMode,
      appId: applicationId,
      pageId,
      timestamp: lastDeployedAt,
      instanceId,
      dslVersion,
    },
    unevalTree: unEvalAndConfigTree,
    widgetTypeConfigMap,
    widgets,
    theme,
    shouldReplay,
    allActionValidationConfig,
    forceEvaluation,
    metaWidgets,
    appMode,
    widgetsMeta,
    shouldRespondWithLogs,
    affectedJSObjects,
    actionDataPayloadConsolidated,
  };

  const workerResponse: EvalTreeResponseData = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_TREE,
    evalTreeRequestData,
    isFirstEvaluation,
  );

  yield call(
    updateDataTreeHandler,
    {
      evalTreeResponse: workerResponse,
      unevalTree,
      configTree: unEvalAndConfigTree.configTree,
      requiresLogging,
    },
    postEvalActions,
  );
}

export function* evaluateActionBindings(
  bindings: string[],
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  callbackData?: Array<unknown>,
  globalContext?: Record<string, unknown>,
) {
  const rootSpan = startRootSpan("DataTreeFactory.create");

  const unEvalTree: ReturnType<typeof getUnevaluatedDataTree> = yield call(
    getUnevalTreeWithWidgetsRegistered,
  );

  endSpan(rootSpan);

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
  const { errors = [] } = response;

  const transformedErrors: EvaluationError[] = yield call(
    transformTriggerEvalErrors,
    errors,
  );

  if (transformedErrors.length) {
    yield fork(showExecutionErrors, transformedErrors);
  }

  yield fork(logDynamicTriggerExecution, {
    dynamicTrigger,
    errors: transformedErrors,
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

function* executeAsyncJSFunction(
  action: JSAction,
  collection: JSCollection,
  onPageLoad: boolean,
) {
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
    onPageLoad: onPageLoad,
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

export function* executeJSFunction(
  action: JSAction,
  collection: JSCollection,
  onPageLoad: boolean,
) {
  const response: {
    errors: unknown[];
    result: unknown;
    logs?: LogObject[];
  } = yield call(executeAsyncJSFunction, action, collection, onPageLoad);
  const { errors, result } = response;
  const isDirty = !!errors.length;

  // After every function execution, log execution errors if present
  yield call(handleJSFunctionExecutionErrorLog, action, collection, errors);

  return { result, isDirty, errors };
}

export // TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* validateProperty(property: string, value: any, props: WidgetProps) {
  const rootSpan = startRootSpan("DataTreeFactory.create");

  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield call(getUnevalTreeWithWidgetsRegistered);

  endSpan(rootSpan);
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

export function* getUnevalTreeWithWidgetsRegistered() {
  yield call(loadAndRegisterOnlyCanvasWidgets);

  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield select(getUnevaluatedDataTree);

  return unEvalAndConfigTree;
}

// We are clubbing all pending action's affected JS objects into the buffered action
// So that during that evaluation cycle all affected JS objects are correctly diffed
function mergeJSBufferedActions(
  prevAffectedJSAction: AffectedJSObjects,
  newAffectedJSAction: AffectedJSObjects,
) {
  if (prevAffectedJSAction.isAllAffected || newAffectedJSAction.isAllAffected) {
    return {
      isAllAffected: true,
      ids: [],
    };
  }

  return {
    isAllAffected: false,
    ids: [...prevAffectedJSAction.ids, ...newAffectedJSAction.ids],
  };
}

export const defaultAffectedJSObjects: AffectedJSObjects = {
  isAllAffected: false,
  ids: [],
};

export interface BUFFERED_ACTION {
  hasDebouncedHandleUpdate: boolean;
  hasBufferedAction: boolean;
  actionDataPayloadConsolidated: actionDataPayload[];
}

export function evalQueueBuffer() {
  let canTake = false;
  let hasDebouncedHandleUpdate = false;
  let hasBufferedAction = false;
  let actionDataPayloadConsolidated: actionDataPayload = [];

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let collectedPostEvalActions: any = [];
  let collectedAffectedJSObjects: AffectedJSObjects = defaultAffectedJSObjects;

  const take = () => {
    if (canTake) {
      const resp = collectedPostEvalActions;

      collectedPostEvalActions = [];
      const affectedJSObjects = collectedAffectedJSObjects;

      collectedAffectedJSObjects = defaultAffectedJSObjects;
      canTake = false;
      const actionDataPayloadConsolidatedRes = actionDataPayloadConsolidated;

      const hasDebouncedHandleUpdateRes = hasDebouncedHandleUpdate;
      const hasBufferedActionRes = hasBufferedAction;

      actionDataPayloadConsolidated = [];
      hasDebouncedHandleUpdate = false;
      hasBufferedAction = false;

      return {
        hasDebouncedHandleUpdate: hasDebouncedHandleUpdateRes,
        hasBufferedAction: hasBufferedActionRes,
        actionDataPayloadConsolidated: actionDataPayloadConsolidatedRes,
        postEvalActions: resp,
        affectedJSObjects,
        type: ReduxActionTypes.BUFFERED_ACTION,
      };
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

    if (action.type === ReduxActionTypes.UPDATE_ACTION_DATA) {
      const { actionDataPayload } =
        action.payload as updateActionDataPayloadType;

      if (actionDataPayload && actionDataPayload.length) {
        actionDataPayloadConsolidated = [
          ...actionDataPayloadConsolidated,
          ...actionDataPayload,
        ];
      }

      hasDebouncedHandleUpdate = true;
      canTake = true;

      return;
    }

    hasBufferedAction = true;

    canTake = true;
    // extract the affected JS action ids from the action and pass them
    //  as a part of the buffered action
    const affectedJSObjects = getAffectedJSObjectIdsFromAction(action);

    collectedAffectedJSObjects = mergeJSBufferedActions(
      collectedAffectedJSObjects,
      affectedJSObjects,
    );

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

export function* evalAndLintingHandler(
  isBlockingCall = true,
  action: ReduxAction<unknown>,
  options: Partial<{
    shouldReplay: boolean;
    forceEvaluation: boolean;
    requiresLogging: boolean;
    affectedJSObjects: AffectedJSObjects;
    actionDataPayloadConsolidated: actionDataPayload[];
    isFirstEvaluation?: boolean;
    jsLibrariesTask?: Task;
  }>,
) {
  const span = startRootSpan("evalAndLintingHandler");
  const {
    actionDataPayloadConsolidated,
    affectedJSObjects,
    forceEvaluation,

    isFirstEvaluation = false,
    jsLibrariesTask,
    requiresLogging,
    shouldReplay,
  } = options;

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

  const rootSpan = startRootSpan("DataTreeFactory.create");

  // Generate all the data needed for both eval and linting
  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield call(getUnevalTreeWithWidgetsRegistered);

  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();

  endSpan(rootSpan);

  // wait for the webworker to complete its setup before starting the evaluation
  if (jsLibrariesTask) {
    yield join(jsLibrariesTask);
  }

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
        affectedJSObjects,
        actionDataPayloadConsolidated,
        isFirstEvaluation,
      ),
    );
  }

  if (requiresLinting) {
    effects.push(fn(initiateLinting, unEvalAndConfigTree, forceEvaluation));
  }

  yield all(effects);
  endSpan(span);
}
export function* loadAndRegisterOnlyCanvasWidgets(): Generator<
  Effect,
  (typeof BaseWidget)[],
  unknown
> {
  try {
    const widgetTypes = (yield select(getUsedWidgetTypes)) as string[];

    const uiModuleTypes = (yield select(
      getAllUniqueWidgetTypesInUiModules,
    )) as string[];

    const uniqueWidgetTypes = Array.from(
      new Set([...uiModuleTypes, ...widgetTypes, "SKELETON_WIDGET"]),
    );

    // Filter out already registered widget types
    const unregisteredWidgetTypes = uniqueWidgetTypes.filter(
      (type: string) => !WidgetFactory.widgetsMap.has(type),
    );

    if (!unregisteredWidgetTypes.length) {
      return [];
    }

    // Load only unregistered widgets in parallel
    const loadedWidgets = (yield all(
      unregisteredWidgetTypes.map((type: string) => call(loadWidget, type)),
    )) as (typeof BaseWidget)[];

    // Register only the newly loaded widgets
    registerWidgets(loadedWidgets);

    clearAllWidgetFactoryCache();

    return loadedWidgets;
  } catch (error) {
    log.error("Error loading and registering widgets:", error);
    throw error;
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* evaluationChangeListenerSaga(): any {
  const firstEvalActionChannel = yield actionChannel(FIRST_EVAL_REDUX_ACTIONS);

  const initializeJSLibrariesChannel = yield actionChannel(
    ReduxActionTypes.DEFER_LOADING_JS_LIBRARIES,
  );
  const appMode = yield select(getAppMode);

  let jsLibrariesTask: Task | undefined;

  // for all published apps, we need to reset the data tree and setup the worker as an independent process
  // after the process is forked we can allow the main thread to continue its execution since the main thread's tasks would be independent
  // we just need to ensure that the webworker setup is completed before the first evaluation is triggered
  if (appMode === APP_MODE.PUBLISHED) {
    yield put({ type: ReduxActionTypes.RESET_DATA_TREE });
    jsLibrariesTask = yield fork(
      webWorkerSetupSagaWithJSLibraries,
      initializeJSLibrariesChannel,
    );
  } else {
    // for all other modes, just call the webworker
    yield call(webWorkerSetupSaga);
  }

  const initAction: EvaluationReduxAction<unknown> = yield take(
    firstEvalActionChannel,
  );

  firstEvalActionChannel.close();

  yield fork(evalAndLintingHandler, false, initAction, {
    shouldReplay: false,
    forceEvaluation: false,
    // during startup all JS objects are affected
    affectedJSObjects: {
      ids: [],
      isAllAffected: true,
    },
    isFirstEvaluation: true,
    jsLibrariesTask: jsLibrariesTask,
  });
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evtActionChannel: ActionPattern<Action<any>> = yield actionChannel(
    EVAL_AND_LINT_REDUX_ACTIONS,
    evalQueueBuffer(),
  );

  yield call(evaluationLoopWithDebounce, evtActionChannel);
}

export function* evaluationLoopWithDebounce(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evtActionChannel: ActionPattern<Action<any>>,
) {
  while (true) {
    const action: EvaluationReduxAction<unknown | unknown[]> =
      yield take(evtActionChannel);

    const { payload, type } = action;

    if (type === ReduxActionTypes.UPDATE_ACTION_DATA) {
      yield call(
        evalWorker.request,
        EVAL_WORKER_ACTIONS.UPDATE_ACTION_DATA,
        (payload as updateActionDataPayloadType).actionDataPayload,
      );
      continue;
    }

    if (type !== ReduxActionTypes.BUFFERED_ACTION) {
      const affectedJSObjects = getAffectedJSObjectIdsFromAction(action);

      yield call(evalAndLintingHandler, true, action, {
        shouldReplay: get(action, "payload.shouldReplay"),
        forceEvaluation: shouldForceEval(action),
        requiresLogging: shouldLog(action),
        affectedJSObjects,
      });
      continue;
    }

    // all buffered debounced actions are handled here
    const {
      actionDataPayloadConsolidated,
      hasBufferedAction,
      hasDebouncedHandleUpdate,
    } = action as unknown as BUFFERED_ACTION;

    // when there are both debounced action updates evaluation and a regular evaluation
    // we will convert that to a regular evaluation this should help in performance by
    // not performing a debounced action updates evaluation
    if (hasDebouncedHandleUpdate && hasBufferedAction) {
      const affectedJSObjects = getAffectedJSObjectIdsFromAction(action);

      yield call(evalAndLintingHandler, true, action, {
        actionDataPayloadConsolidated,
        shouldReplay: get(action, "payload.shouldReplay"),
        forceEvaluation: shouldForceEval(action),
        requiresLogging: shouldLog(action),
        affectedJSObjects,
      });

      continue;
    }

    if (hasDebouncedHandleUpdate) {
      yield call(
        evalWorker.request,
        EVAL_WORKER_ACTIONS.UPDATE_ACTION_DATA,
        actionDataPayloadConsolidated,
      );
    }

    if (hasBufferedAction) {
      // We are dequing actions from the buffer and inferring the JS actions affected by each
      // action. Through this we know ahead the nodes we need to specifically diff, thereby improving performance.
      const affectedJSObjects = getAffectedJSObjectIdsFromAction(action);

      yield call(evalAndLintingHandler, true, action, {
        shouldReplay: get(action, "payload.shouldReplay"),
        forceEvaluation: shouldForceEval(action),
        requiresLogging: shouldLog(action),
        affectedJSObjects,
      });
    }
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    appsmithTelemetry.captureException(e, { errorName: "EvaluationError" });
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
      appsmithTelemetry.captureException(e, { errorName: "EvaluationError" });
    }
  }
}

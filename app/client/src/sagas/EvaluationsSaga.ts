import type { ActionPattern } from "redux-saga/effects";
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
  AnyReduxAction,
  ReduxAction,
  ReduxActionType,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getDataTree,
  getUnevaluatedDataTree,
} from "selectors/dataTreeSelectors";
import { getMetaWidgets, getWidgets } from "sagas/selectors";
import type { WidgetTypeConfigMap } from "utils/WidgetFactory";
import WidgetFactory from "utils/WidgetFactory";
import { GracefulWorkerService } from "utils/WorkerUtil";
import type { EvalError } from "utils/DynamicBindingUtils";
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
  EVALUATE_REDUX_ACTIONS,
  FIRST_EVAL_REDUX_ACTIONS,
  setDependencyMap,
  setEvaluatedTree,
  shouldLint,
  shouldLog,
  shouldProcessBatchedAction,
} from "actions/evaluationActions";
import ConfigTreeActions from "utils/configTree";
import {
  evalErrorHandler,
  handleJSFunctionExecutionErrorLog,
  logSuccessfulBindings,
  postEvalActionDispatcher,
  updateTernDefinitions,
} from "./PostEvaluationSagas";
import type { JSAction } from "entities/JSCollection";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { get, isEmpty, isUndefined } from "lodash";
import {
  setEvaluatedArgument,
  setEvaluatedSnippet,
  setGlobalSearchFilterContext,
} from "actions/globalSearchActions";
import type { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import { executeActionTriggers } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Toaster, Variant } from "design-system-old";
import {
  createMessage,
  SNIPPET_EXECUTION_FAILED,
  SNIPPET_EXECUTION_SUCCESS,
} from "@appsmith/constants/messages";
import { validate } from "workers/Evaluation/validations";
import { diff } from "deep-diff";
import { REPLAY_DELAY } from "entities/Replay/replayUtils";
import type { EvaluationVersion } from "@appsmith/api/ApplicationApi";
import { makeUpdateJSCollection } from "sagas/JSPaneSagas";
import type { LogObject } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import type { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";
import {
  logActionExecutionError,
  UncaughtPromiseError,
} from "sagas/ActionExecution/errorUtils";
import type { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import type { FormEvalActionPayload } from "./FormEvaluationSaga";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { resetWidgetsMetaState, updateMetaState } from "actions/metaActions";
import {
  getAllActionValidationConfig,
  getAllJSActionsData,
} from "selectors/entitiesSelector";
import type {
  DataTree,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { AppTheme } from "entities/AppTheming";
import type { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import { lintWorker } from "./LintingSagas";
import type {
  EvalTreeRequestData,
  EvalTreeResponseData,
} from "workers/Evaluation/types";
import type { ActionDescription } from "@appsmith/workers/Evaluation/fns";
import { handleEvalWorkerRequestSaga } from "./EvalWorkerActionSagas";
import { getAppsmithConfigs } from "ce/configs";

const APPSMITH_CONFIGS = getAppsmithConfigs();

export const evalWorker = new GracefulWorkerService(
  new Worker(
    new URL("../workers/Evaluation/evaluation.worker.ts", import.meta.url),
    {
      type: "module",
      name: "evalWorker",
    },
  ),
);

let widgetTypeConfigMap: WidgetTypeConfigMap;

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
  postEvalActions?: Array<AnyReduxAction>,
  shouldReplay = true,
  requiresLinting = false,
  forceEvaluation = false,
  requiresLogging = false,
) {
  const allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  } = yield select(getAllActionValidationConfig);
  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield select(getUnevaluatedDataTree);
  const unevalTree = unEvalAndConfigTree.unEvalTree;
  const widgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const metaWidgets: MetaWidgetsReduxState = yield select(getMetaWidgets);
  const theme: AppTheme = yield select(getSelectedAppTheme);
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const isEditMode = appMode === APP_MODE.EDIT;
  const toPrintConfigTree = unEvalAndConfigTree.configTree;
  log.debug({ unevalTree, configTree: toPrintConfigTree });
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  const evalTreeRequestData: EvalTreeRequestData = {
    unevalTree: unEvalAndConfigTree,
    widgetTypeConfigMap,
    widgets,
    theme,
    shouldReplay,
    allActionValidationConfig,
    requiresLinting: isEditMode && requiresLinting,
    forceEvaluation,
    metaWidgets,
  };

  const workerResponse: EvalTreeResponseData = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_TREE,
    evalTreeRequestData,
  );

  const {
    dataTree,
    dependencies,
    errors,
    evalMetaUpdates = [],
    evaluationOrder,
    jsUpdates,
    logs,
    unEvalUpdates,
    isCreateFirstTree = false,
    configTree,
    staleMetaIds,
    pathsToClearErrorsFor,
    isNewWidgetAdded,
  } = workerResponse;

  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );
  const oldDataTree: DataTree = yield select(getDataTree);

  const updates = diff(oldDataTree, dataTree) || [];

  if (!isEmpty(staleMetaIds)) {
    yield put(resetWidgetsMetaState(staleMetaIds));
  }
  yield put(setEvaluatedTree(updates));
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
  // Added type as any due to https://github.com/redux-saga/redux-saga/issues/1482
  yield call(
    evalErrorHandler as any,
    errors,
    updatedDataTree,
    evaluationOrder,
    configTree,
    pathsToClearErrorsFor,
  );

  if (appMode !== APP_MODE.PUBLISHED) {
    const jsData: Record<string, unknown> = yield select(getAllJSActionsData);
    yield call(makeUpdateJSCollection, jsUpdates);

    if (requiresLogging) {
      yield fork(
        logSuccessfulBindings,
        unevalTree,
        updatedDataTree,
        evaluationOrder,
        isCreateFirstTree,
        isNewWidgetAdded,
        configTree,
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
  if (postEvalActions && postEvalActions.length) {
    yield call(postEvalActionDispatcher, postEvalActions);
  }
}

export function* evaluateActionBindings(
  bindings: string[],
  executionParams: Record<string, any> | string = {},
) {
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
  // const unEvalTree = unEvalAndConfigTree.unEvalTree;
  log.debug({ execute: dynamicTrigger });
  const response: unknown = yield call(
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
  yield call(evalErrorHandler, errors);
  if (errors.length) {
    if (
      errors[0].errorMessage !==
      "UncaughtPromiseRejection: User cancelled action execution"
    ) {
      const errorMessage =
        `${errors[0].errorMessage.name}: ${errors[0].errorMessage.message}` ||
        errors[0].message;
      throw new UncaughtPromiseError(errorMessage);
    }
  }
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
  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.CLEAR_CACHE);
  return true;
}

interface JSFunctionExecutionResponse {
  errors: unknown[];
  result: unknown;
  logs?: LogObject[];
}

function* executeAsyncJSFunction(
  collectionName: string,
  action: JSAction,
  collectionId: string,
) {
  let response: JSFunctionExecutionResponse;
  const functionCall = `${collectionName}.${action.name}()`;
  const triggerMeta = {
    source: {
      id: collectionId,
      name: `${collectionName}.${action.name}`,
      type: ENTITY_TYPE.JSACTION,
    },
    triggerPropertyName: `${collectionName}.${action.name}`,
  };
  const eventType = EventType.ON_JS_FUNCTION_EXECUTE;
  try {
    response = yield call(
      evaluateAndExecuteDynamicTrigger,
      functionCall,
      eventType,
      triggerMeta,
    );
  } catch (e) {
    if (e instanceof UncaughtPromiseError) {
      logActionExecutionError(e.message);
    }
    response = { errors: [e], result: undefined };
  }
  return response;
}

function* executeSyncJSFunction(
  collectionName: string,
  action: JSAction,
  collectionId: string,
) {
  const functionCall = `${collectionName}.${action.name}()`;
  const triggerMeta = {
    source: {
      id: collectionId,
      name: `${collectionName}.${action.name}`,
      type: ENTITY_TYPE.JSACTION,
    },
    triggerPropertyName: `${collectionName}.${action.name}`,
  };
  const eventType = EventType.ON_JS_FUNCTION_EXECUTE;
  const response: JSFunctionExecutionResponse = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS,
    {
      functionCall,
      triggerMeta,
      eventType,
    },
  );
  return response;
}

export function* executeJSFunction(
  collectionName: string,
  action: JSAction,
  collectionId: string,
) {
  const { isAsync } = action.actionConfiguration;
  let response: {
    errors: unknown[];
    result: unknown;
    logs?: LogObject[];
  };

  try {
    if (isAsync) {
      response = yield call(
        executeAsyncJSFunction,
        collectionName,
        action,
        collectionId,
      );
    } else {
      response = yield call(
        executeSyncJSFunction,
        collectionName,
        action,
        collectionId,
      );
    }
  } catch (e) {
    if (e instanceof UncaughtPromiseError) {
      logActionExecutionError(e.message);
    }
    response = { errors: [e], result: undefined };
  }
  const { errors, result } = response;
  const isDirty = !!errors.length;

  // After every function execution, log execution errors if present
  yield call(
    handleJSFunctionExecutionErrorLog,
    collectionId,
    collectionName,
    action,
    errors,
  );
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
    if (!shouldProcessBatchedAction(action)) {
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

function* evaluationChangeListenerSaga(): any {
  // Explicitly shutdown old worker if present
  yield all([call(evalWorker.shutdown), call(lintWorker.shutdown)]);
  const [evalWorkerListenerChannel] = yield all([
    call(evalWorker.start),
    call(lintWorker.start),
  ]);

  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.SETUP, {
    cloudHosting: !!APPSMITH_CONFIGS.cloudHosting,
  });
  yield spawn(handleEvalWorkerRequestSaga, evalWorkerListenerChannel);

  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  const initAction: {
    type: ReduxActionType;
    postEvalActions: Array<ReduxAction<unknown>>;
  } = yield take(FIRST_EVAL_REDUX_ACTIONS);
  yield fork(evaluateTreeSaga, initAction.postEvalActions, false, true, false);
  const evtActionChannel: ActionPattern<Action<any>> = yield actionChannel(
    EVALUATE_REDUX_ACTIONS,
    evalQueueBuffer(),
  );
  while (true) {
    const action: EvaluationReduxAction<unknown | unknown[]> = yield take(
      evtActionChannel,
    );

    if (shouldProcessBatchedAction(action)) {
      const postEvalActions = getPostEvalActions(action);

      yield call(
        evaluateTreeSaga,
        postEvalActions,
        get(action, "payload.shouldReplay"),
        shouldLint(action),
        false,
        shouldLog(action),
      );
    }
  }
}

export function* evaluateSnippetSaga(action: any) {
  try {
    let { expression } = action.payload;
    const { dataType, isTrigger } = action.payload;
    if (isTrigger) {
      expression = `(function() { ${expression} })()`;
    }
    const workerResponse: {
      errors: any;
      result: any;
      triggers: any;
    } = yield call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_EXPRESSION, {
      expression,
      dataType,
    });
    const { errors, result } = workerResponse;
    /*
        JSON.stringify(undefined) is undefined.
        We need to set it manually to "undefined" for codeEditor to display it.
      */
    yield put(
      setEvaluatedSnippet(
        errors?.length
          ? JSON.stringify(errors, null, 2)
          : isUndefined(result)
          ? "undefined"
          : JSON.stringify(result),
      ),
    );
    Toaster.show({
      text: createMessage(
        errors?.length ? SNIPPET_EXECUTION_FAILED : SNIPPET_EXECUTION_SUCCESS,
      ),
      variant: errors?.length ? Variant.danger : Variant.success,
    });
    yield put(
      setGlobalSearchFilterContext({
        executionInProgress: false,
      }),
    );
  } catch (e) {
    yield put(
      setGlobalSearchFilterContext({
        executionInProgress: false,
      }),
    );
    Toaster.show({
      text: createMessage(SNIPPET_EXECUTION_FAILED),
      variant: Variant.danger,
    });
    log.error(e);
    Sentry.captureException(e);
  }
}

export function* evaluateArgumentSaga(action: any) {
  const { name, type, value } = action.payload;
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
      setEvaluatedArgument({
        [name]: {
          type,
          value: workerResponse.result,
          name,
          errors: lintErrors,
          isInvalid: lintErrors.length > 0,
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

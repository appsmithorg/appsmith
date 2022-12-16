import {
  actionChannel,
  ActionPattern,
  all,
  call,
  delay,
  fork,
  put,
  select,
  spawn,
  take,
} from "redux-saga/effects";

import {
  EvaluationReduxAction,
  AnyReduxAction,
  ReduxAction,
  ReduxActionType,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getDataTree,
  getUnevaluatedDataTree,
} from "selectors/dataTreeSelectors";
import { getWidgets } from "sagas/selectors";
import WidgetFactory, { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { GracefulWorkerService } from "utils/WorkerUtil";
import {
  EvalError,
  EVAL_WORKER_ACTIONS,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import log from "loglevel";
import { WidgetProps } from "widgets/BaseWidget";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { Action } from "redux";
import {
  EVALUATE_REDUX_ACTIONS,
  FIRST_EVAL_REDUX_ACTIONS,
  setDependencyMap,
  setEvaluatedTree,
  shouldLint,
  shouldProcessBatchedAction,
} from "actions/evaluationActions";
import {
  evalErrorHandler,
  handleJSFunctionExecutionErrorLog,
  logSuccessfulBindings,
  postEvalActionDispatcher,
  updateTernDefinitions,
} from "./PostEvaluationSagas";
import { JSAction } from "entities/JSCollection";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { get, isUndefined } from "lodash";
import {
  setEvaluatedArgument,
  setEvaluatedSnippet,
  setGlobalSearchFilterContext,
} from "actions/globalSearchActions";
import {
  executeActionTriggers,
  TriggerMeta,
} from "./ActionExecution/ActionExecutionSagas";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Toaster, Variant } from "design-system";
import {
  createMessage,
  SNIPPET_EXECUTION_FAILED,
  SNIPPET_EXECUTION_SUCCESS,
} from "@appsmith/constants/messages";
import { validate } from "workers/Evaluation/validations";
import { diff } from "deep-diff";
import { REPLAY_DELAY } from "entities/Replay/replayUtils";
import { EvaluationVersion } from "api/ApplicationApi";
import { makeUpdateJSCollection } from "sagas/JSPaneSagas";
import {
  ENTITY_TYPE,
  LogObject,
  UserLogObject,
} from "entities/AppsmithConsole";
import { Replayable } from "entities/Replay/ReplayEntity/ReplayEditor";
import {
  logActionExecutionError,
  UncaughtPromiseError,
} from "sagas/ActionExecution/errorUtils";
import { Channel } from "redux-saga";
import { ActionDescription } from "entities/DataTree/actionTriggers";
import { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import { FormEvalActionPayload } from "./FormEvaluationSaga";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { updateMetaState } from "actions/metaActions";
import { getAllActionValidationConfig } from "selectors/entitiesSelector";
import {
  DataTree,
  UnEvalTree,
  UnEvalTreeWidget,
} from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppTheme } from "entities/AppTheming";
import { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import { storeLogs, updateTriggerMeta } from "./DebuggerSagas";
import { lintTreeSaga, lintWorker } from "./LintingSagas";
import {
  EvalTreeRequestData,
  EvalTreeResponseData,
} from "workers/Evaluation/types";

const evalWorker = new GracefulWorkerService(
  new Worker(
    new URL("../workers/Evaluation/evaluation.worker.ts", import.meta.url),
    {
      type: "module",
      name: "evalWorker",
    },
  ),
);

let widgetTypeConfigMap: WidgetTypeConfigMap;

function* evaluateTreeSaga(
  postEvalActions?: Array<AnyReduxAction>,
  shouldReplay = true,
  requiresLinting = false,
) {
  const allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  } = yield select(getAllActionValidationConfig);
  const unevalTree: UnEvalTree = yield select(getUnevaluatedDataTree);
  const widgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const theme: AppTheme = yield select(getSelectedAppTheme);
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const isEditMode = appMode === APP_MODE.EDIT;
  log.debug({ unevalTree });
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  const evalTreeRequestData: EvalTreeRequestData = {
    unevalTree,
    widgetTypeConfigMap,
    widgets,
    theme,
    shouldReplay,
    allActionValidationConfig,
    requiresLinting: isEditMode && requiresLinting,
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
    userLogs,
    unEvalUpdates,
    isCreateFirstTree = false,
  } = workerResponse;
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );
  const oldDataTree: DataTree = yield select(getDataTree);

  const updates = diff(oldDataTree, dataTree) || [];

  yield put(setEvaluatedTree(updates));
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.SET_EVALUATED_TREE,
  );
  // if evalMetaUpdates are present only then dispatch updateMetaState
  if (evalMetaUpdates.length) {
    yield put(updateMetaState(evalMetaUpdates));
  }
  log.debug({ evalMetaUpdatesLength: evalMetaUpdates.length });

  const updatedDataTree: DataTree = yield select(getDataTree);
  if (
    !(!isCreateFirstTree && Object.keys(jsUpdates).length > 0) &&
    !!userLogs &&
    userLogs.length > 0
  ) {
    yield all(
      userLogs.map((log: UserLogObject) => {
        return call(
          storeLogs,
          log.logObject,
          log.source.name,
          log.source.type,
          log.source.id,
        );
      }),
    );
  }
  log.debug({ jsUpdates: jsUpdates });
  log.debug({ dataTree: updatedDataTree });
  logs?.forEach((evalLog: any) => log.debug(evalLog));
  // Added type as any due to https://github.com/redux-saga/redux-saga/issues/1482
  yield call(evalErrorHandler as any, errors, updatedDataTree, evaluationOrder);

  if (appMode !== APP_MODE.PUBLISHED) {
    yield call(makeUpdateJSCollection, jsUpdates);
    yield fork(
      logSuccessfulBindings,
      unevalTree,
      updatedDataTree,
      evaluationOrder,
      isCreateFirstTree,
    );

    yield fork(
      updateTernDefinitions,
      updatedDataTree,
      unEvalUpdates,
      isCreateFirstTree,
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

/*
 * Used to evaluate and execute dynamic trigger end to end
 * Widget action fields and JS Object run triggers this flow
 *
 * We start a duplex request with the worker and wait till the time we get a 'finished' event from the
 * worker. Worker will evaluate a block of code and ask the main thread to execute it. The result of this
 * execution is returned to the worker where it can resolve/reject the current promise.
 */

export function* evaluateAndExecuteDynamicTrigger(
  dynamicTrigger: string,
  eventType: EventType,
  triggerMeta: TriggerMeta,
  callbackData?: Array<any>,
  globalContext?: Record<string, unknown>,
) {
  const unEvalTree: DataTree = yield select(getUnevaluatedDataTree);
  log.debug({ execute: dynamicTrigger });
  const { isFinishedChannel } = yield call(
    evalWorker.duplexRequest,
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

  let keepAlive = true;

  while (keepAlive) {
    const { requestData } = yield take(isFinishedChannel);
    log.debug({ requestData, eventType, triggerMeta, dynamicTrigger });

    if (requestData.finished) {
      keepAlive = false;

      const { result } = requestData;
      yield call(updateTriggerMeta, triggerMeta, dynamicTrigger);

      // Check for any logs in the response and store them in the redux store
      if (
        !!result &&
        result.hasOwnProperty("logs") &&
        !!result.logs &&
        result.logs.length
      ) {
        yield call(
          storeLogs,
          result.logs,
          triggerMeta.source?.name || triggerMeta.triggerPropertyName || "",
          eventType === EventType.ON_JS_FUNCTION_EXECUTE
            ? ENTITY_TYPE.JSACTION
            : ENTITY_TYPE.WIDGET,
          triggerMeta.source?.id || "",
        );
      }

      /* Handle errors during evaluation
       * A finish event with errors means that the error was not caught by the user code.
       * We raise an error telling the user that an uncaught error has occurred
       * */
      if (
        !!result &&
        result.hasOwnProperty("errors") &&
        !!result.errors &&
        result.errors.length
      ) {
        if (
          result.errors[0].errorMessage !==
          "UncaughtPromiseRejection: User cancelled action execution"
        ) {
          throw new UncaughtPromiseError(result.errors[0].errorMessage);
        }
      }

      // It is possible to get a few triggers here if the user
      // still uses the old way of action runs and not promises. For that we
      // need to manually execute these triggers outside the promise flow
      const { triggers } = result;
      if (triggers && triggers.length) {
        log.debug({ triggers });
        yield all(
          triggers.map((trigger: ActionDescription) =>
            call(executeActionTriggers, trigger, eventType, triggerMeta),
          ),
        );
      }
      // Return value of a promise is returned
      isFinishedChannel.close();
      return result;
    }
    yield call(evalErrorHandler, requestData.errors);
    isFinishedChannel.close();
  }
}

export function* executeDynamicTriggerRequest(
  mainThreadRequestChannel: Channel<any>,
) {
  while (true) {
    const { mainThreadResponseChannel, requestData, requestId } = yield take(
      mainThreadRequestChannel,
    );
    log.debug({ requestData });
    if (requestData?.logs) {
      const { eventType, triggerMeta } = requestData;
      yield call(
        storeLogs,
        requestData.logs,
        triggerMeta?.source?.name || triggerMeta?.triggerPropertyName || "",
        eventType === EventType.ON_JS_FUNCTION_EXECUTE
          ? ENTITY_TYPE.JSACTION
          : ENTITY_TYPE.WIDGET,
        triggerMeta?.source?.id || "",
      );
    }
    if (requestData?.trigger) {
      // if we have found a trigger, we need to execute it and respond back
      log.debug({ trigger: requestData.trigger });
      yield spawn(
        executeTriggerRequestSaga,
        requestId,
        requestData,
        requestData.eventType,
        mainThreadResponseChannel,
        requestData.triggerMeta,
      );
    }
    if (requestData.type === EVAL_WORKER_ACTIONS.LINT_TREE) {
      yield spawn(lintTreeSaga, {
        pathsToLint: requestData.lintOrder,
        unevalTree: requestData.unevalTree,
      });
    }
    if (requestData?.errors) {
      yield call(evalErrorHandler, requestData.errors);
    }
  }
}

interface ResponsePayload {
  data: {
    subRequestId: string;
    reason?: string;
    resolve?: unknown;
  };
  success: boolean;
  eventType?: EventType;
}

/*
 * It is necessary to respond back as the worker is waiting with a pending promise and wanting to know if it should
 * resolve or reject it with the data the execution has provided
 */
function* executeTriggerRequestSaga(
  requestId: string,
  requestData: { trigger: ActionDescription; subRequestId: string },
  eventType: EventType,
  responseFromExecutionChannel: Channel<unknown>,
  triggerMeta: TriggerMeta,
) {
  const responsePayload: ResponsePayload = {
    data: {
      resolve: undefined,
      reason: undefined,
      subRequestId: requestData.subRequestId,
    },
    success: false,
    eventType,
  };
  try {
    responsePayload.data.resolve = yield call(
      executeActionTriggers,
      requestData.trigger,
      eventType,
      triggerMeta,
    );
    responsePayload.success = true;
  } catch (error) {
    // When error occurs in execution of triggers,
    // a success: false is sent to reject the promise

    // @ts-expect-error: reason is of type string
    responsePayload.data.reason = { message: error.message };
    responsePayload.success = false;
  }
  responseFromExecutionChannel.put({
    method: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
    requestId: requestId,
    ...responsePayload,
  });
}

export function* clearEvalCache() {
  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.CLEAR_CACHE);

  return true;
}

export function* executeFunction(
  collectionName: string,
  action: JSAction,
  collectionId: string,
) {
  const functionCall = `${collectionName}.${action.name}()`;
  const { isAsync } = action.actionConfiguration;
  let response: {
    errors: any[];
    result: any;
    logs?: LogObject[];
  };

  if (isAsync) {
    try {
      response = yield call(
        evaluateAndExecuteDynamicTrigger,
        functionCall,
        EventType.ON_JS_FUNCTION_EXECUTE,
        {
          source: {
            id: collectionId,
            name: `${collectionName}.${action.name}`,
          },
          triggerPropertyName: `${collectionName}.${action.name}`,
        },
      );
    } catch (e) {
      if (e instanceof UncaughtPromiseError) {
        logActionExecutionError(e.message);
      }
      response = { errors: [e], result: undefined };
    }
  } else {
    response = yield call(
      evalWorker.request,
      EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS,
      {
        functionCall,
      },
    );

    const { logs } = response;
    // Check for any logs in the response and store them in the redux store
    if (!!logs && logs.length > 0) {
      yield call(
        storeLogs,
        logs,
        collectionName + "." + action.name,
        ENTITY_TYPE.JSACTION,
        collectionId,
      );
    }
  }

  const { errors, result } = response;

  const isDirty = !!errors.length;

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
  const unevalTree: UnEvalTree = yield select(getUnevaluatedDataTree);
  const entity = unevalTree[props.widgetName] as UnEvalTreeWidget;
  const validation = entity?.__config__.validationPaths[property];
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

function* evaluationChangeListenerSaga() {
  // Explicitly shutdown old worker if present
  yield all([call(evalWorker.shutdown), call(lintWorker.shutdown)]);
  const [{ mainThreadRequestChannel }] = yield all([
    call(evalWorker.start),
    call(lintWorker.start),
  ]);

  yield call(evalWorker.request, EVAL_WORKER_ACTIONS.SETUP);
  yield spawn(executeDynamicTriggerRequest, mainThreadRequestChannel);

  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  const initAction: {
    type: ReduxActionType;
    postEvalActions: Array<ReduxAction<unknown>>;
  } = yield take(FIRST_EVAL_REDUX_ACTIONS);
  yield fork(evaluateTreeSaga, initAction.postEvalActions, false, true);
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
      );
    }
  }
}

export function* evaluateSnippetSaga(action: any) {
  try {
    let { expression } = action.payload;
    const { dataType, isTrigger } = action.payload;
    if (isTrigger) {
      expression = `function() { ${expression} }`;
    }
    const workerResponse: {
      errors: any;
      result: any;
      triggers: any;
    } = yield call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_EXPRESSION, {
      expression,
      dataType,
      isTrigger,
    });
    const { errors, result, triggers } = workerResponse;
    if (triggers && triggers.length > 0) {
      yield all(
        triggers.map((trigger: any) =>
          call(
            executeActionTriggers,
            trigger,
            EventType.ON_SNIPPET_EXECUTE,
            {},
          ),
        ),
      );
      //Result is when trigger is present. Following code will hide the evaluated snippet section
      yield put(setEvaluatedSnippet(result));
    } else {
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
    }
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

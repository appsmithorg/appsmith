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
import Worker from "worker-loader!../workers/evaluation.worker";
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
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  createMessage,
  SNIPPET_EXECUTION_FAILED,
  SNIPPET_EXECUTION_SUCCESS,
} from "@appsmith/constants/messages";
import { validate } from "workers/validations";
import { diff } from "deep-diff";
import { REPLAY_DELAY } from "entities/Replay/replayUtils";
import { EvaluationVersion } from "api/ApplicationApi";
import { makeUpdateJSCollection } from "sagas/JSPaneSagas";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
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
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { EvalMetaUpdates } from "workers/DataTreeEvaluator/types";
import { JSUpdate } from "utils/JSPaneUtils";
import { DataTreeDiff } from "workers/evaluationUtils";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppTheme } from "entities/AppTheming";
import { ActionValidationConfigMap } from "constants/PropertyControlConstants";

let widgetTypeConfigMap: WidgetTypeConfigMap;

const worker = new GracefulWorkerService(Worker);

export type EvalTreePayload = {
  dataTree: DataTree;
  dependencies: Record<string, string[]>;
  errors: EvalError[];
  evalMetaUpdates: EvalMetaUpdates;
  evaluationOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
  logs: any[];
  unEvalUpdates: DataTreeDiff[];
  isCreateFirstTree: boolean;
};

function* evaluateTreeSaga(
  postEvalActions?: Array<AnyReduxAction>,
  shouldReplay?: boolean,
) {
  const allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  } = yield select(getAllActionValidationConfig);
  const unevalTree: DataTree = yield select(getUnevaluatedDataTree);
  const widgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const theme: AppTheme = yield select(getSelectedAppTheme);

  log.debug({ unevalTree });
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );

  // @ts-expect-error: Worker Response is unknown
  const workerResponse = yield call(
    worker.request,
    EVAL_WORKER_ACTIONS.EVAL_TREE,
    {
      unevalTree,
      widgetTypeConfigMap,
      widgets,
      theme,
      shouldReplay,
      allActionValidationConfig,
    },
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
  }: EvalTreePayload = workerResponse;
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
  log.debug({ jsUpdates: jsUpdates });
  log.debug({ dataTree: updatedDataTree });
  logs?.forEach((evalLog: any) => log.debug(evalLog));
  // Added type as any due to https://github.com/redux-saga/redux-saga/issues/1482
  yield call(evalErrorHandler as any, errors, updatedDataTree, evaluationOrder);

  const appMode: APP_MODE | undefined = yield select(getAppMode);
  if (appMode !== APP_MODE.PUBLISHED) {
    yield call(makeUpdateJSCollection, jsUpdates);
    yield fork(
      logSuccessfulBindings,
      unevalTree,
      updatedDataTree,
      evaluationOrder,
      isCreateFirstTree,
    );

    yield fork(updateTernDefinitions, updatedDataTree, unEvalUpdates);
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

  const { requestChannel, responseChannel } = yield call(
    worker.duplexRequest,
    EVAL_WORKER_ACTIONS.EVAL_TRIGGER,
    { dataTree: unEvalTree, dynamicTrigger, callbackData, globalContext },
  );
  let keepAlive = true;

  while (keepAlive) {
    const { requestData } = yield take(requestChannel);
    log.debug({ requestData });
    if (requestData.finished) {
      keepAlive = false;
      /* Handle errors during evaluation
       * A finish event with errors means that the error was not caught by the user code.
       * We raise an error telling the user that an uncaught error has occurred
       * */
      if (requestData.result.errors.length) {
        if (
          requestData.result.errors[0].errorMessage !==
          "UncaughtPromiseRejection: User cancelled action execution"
        ) {
          throw new UncaughtPromiseError(
            requestData.result.errors[0].errorMessage,
          );
        }
      }
      // It is possible to get a few triggers here if the user
      // still uses the old way of action runs and not promises. For that we
      // need to manually execute these triggers outside the promise flow
      const { triggers } = requestData.result;
      if (triggers && triggers.length) {
        log.debug({ triggers });
        yield all(
          triggers.map((trigger: ActionDescription) =>
            call(executeActionTriggers, trigger, eventType, triggerMeta),
          ),
        );
      }
      // Return value of a promise is returned
      return requestData.result;
    }
    yield call(evalErrorHandler, requestData.errors);
    if (requestData.trigger) {
      // if we have found a trigger, we need to execute it and respond back
      log.debug({ trigger: requestData.trigger });
      yield spawn(
        executeTriggerRequestSaga,
        requestData,
        eventType,
        responseChannel,
        triggerMeta,
      );
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
}

/*
 * It is necessary to respond back as the worker is waiting with a pending promise and wanting to know if it should
 * resolve or reject it with the data the execution has provided
 */
function* executeTriggerRequestSaga(
  requestData: { trigger: ActionDescription; subRequestId: string },
  eventType: EventType,
  responseChannel: Channel<unknown>,
  triggerMeta: TriggerMeta,
) {
  const responsePayload: ResponsePayload = {
    data: {
      resolve: undefined,
      reason: undefined,
      subRequestId: requestData.subRequestId,
    },
    success: false,
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
    responsePayload.data.reason = error;
    responsePayload.success = false;
  }
  responseChannel.put({
    method: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
    ...responsePayload,
  });
}

export function* clearEvalCache() {
  yield call(worker.request, EVAL_WORKER_ACTIONS.CLEAR_CACHE);

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
  };

  if (isAsync) {
    try {
      response = yield call(
        evaluateAndExecuteDynamicTrigger,
        functionCall,
        EventType.ON_JS_FUNCTION_EXECUTE,
        {},
      );
    } catch (e) {
      if (e instanceof UncaughtPromiseError) {
        logActionExecutionError(e.message);
      }
      response = { errors: [e], result: undefined };
    }
  } else {
    response = yield call(worker.request, EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS, {
      functionCall,
    });
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
  const unevalTree: DataTree = yield select(getUnevaluatedDataTree);
  // @ts-expect-error: We have a typeMismatch for validationPaths
  const validation = unevalTree[props.widgetName].validationPaths[property];
  const response: unknown = yield call(
    worker.request,
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
  yield call(worker.shutdown);
  yield call(worker.start);
  yield call(worker.request, EVAL_WORKER_ACTIONS.SETUP);
  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  const initAction: {
    postEvalActions: Array<ReduxAction<unknown>>;
  } = yield take(FIRST_EVAL_REDUX_ACTIONS);
  yield fork(evaluateTreeSaga, initAction.postEvalActions);
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
    } = yield call(worker.request, EVAL_WORKER_ACTIONS.EVAL_EXPRESSION, {
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
    } = yield call(worker.request, EVAL_WORKER_ACTIONS.EVAL_EXPRESSION, {
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
    worker.request,
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
  const workerResponse: unknown = yield call(worker.request, operation, {
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
    worker.request,
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
  yield call(worker.request, EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION, {
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

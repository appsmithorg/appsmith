// Workers do not have access to log.error
/* eslint-disable no-console */
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  DependencyMap,
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
} from "utils/DynamicBindingUtils";
import {
  CrashingError,
  DataTreeDiff,
  getSafeToRenderDataTree,
  removeFunctions,
  validateWidgetProperty,
} from "./evaluationUtils";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import ReplayEntity from "entities/Replay";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import ReplayEditor from "entities/Replay/ReplayEntity/ReplayEditor";
import { isEmpty } from "lodash";
import { UserLogObject } from "entities/AppsmithConsole";
import { WorkerErrorTypes } from "workers/common/types";
import {
  EvalTreeRequestData,
  EvalTreeResponseData,
  EvalWorkerRequest,
  EvalWorkerResponse,
  UpdateDependencyRequestData,
  UpdateDependencyResponseData,
} from "./types";
import { EvalMetaUpdates } from "workers/common/DataTreeEvaluator/types";
import { setFormEvaluationSaga } from "workers/Evaluation/formEval";
import evaluate, {
  evaluateAsync,
  setupEvaluationEnvironment,
} from "./evaluate";
import { JSUpdate } from "utils/JSPaneUtils";
import { getUpdatedLocalUnEvalTreeAfterJSUpdates } from "./JSObject";

const CANVAS = "canvas";

export let dataTreeEvaluator: DataTreeEvaluator | undefined;
let isFirstTree = false;

let replayMap: Record<string, ReplayEntity<any>>;

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(fn: typeof eventRequestHandler) {
  return (e: MessageEvent<EvalWorkerRequest>) => {
    const startTime = performance.now();
    const { method, requestData, requestId } = e.data;
    if (method) {
      const responseData = fn({ method, requestData, requestId });
      if (responseData) {
        const endTime = performance.now();
        try {
          postMessage({
            requestId,
            responseData,
            timeTaken: (endTime - startTime).toFixed(2),
          });
        } catch (e) {
          console.error(e);
          // we dont want to log dataTree because it is huge.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { dataTree, ...rest } = requestData;
          postMessage({
            requestId,
            responseData: {
              errors: [
                {
                  type: WorkerErrorTypes.CLONE_ERROR,
                  message: (e as Error)?.message,
                  context: JSON.stringify(rest),
                },
              ],
            },
            timeTaken: (endTime - startTime).toFixed(2),
          });
        }
      }
    }
  };
}

function eventRequestHandler({
  method,
  requestData,
  requestId,
}: EvalWorkerRequest): EvalWorkerResponse {
  switch (method) {
    case EVAL_WORKER_ACTIONS.SETUP: {
      setupEvaluationEnvironment();
      return true;
    }
    case EVAL_WORKER_ACTIONS.EVAL_TREE: {
      const {
        allActionValidationConfig,
        evalOrder,
        jsUpdates,
        shouldReplay,
        unevalTree,
        widgetTypeConfigMap,
      } = requestData as EvalTreeRequestData;

      let dataTree: DataTree = {};
      let errors: EvalError[] = [];
      let logs: any[] = [];
      let userLogs: UserLogObject[] = [];
      let dependencies: DependencyMap = {};
      let evalMetaUpdates: EvalMetaUpdates = [];
      try {
        if (isFirstTree) {
          dataTreeEvaluator = dataTreeEvaluator as DataTreeEvaluator;
          const dataTreeResponse = dataTreeEvaluator.createFirstTree();
          dataTree = dataTreeResponse.evalTree;
          // We need to clean it to remove any possible functions inside the tree.
          // If functions exist, it will crash the web worker
          dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
        } else {
          dataTreeEvaluator = dataTreeEvaluator as DataTreeEvaluator;
          if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
            dataTreeEvaluator.setAllActionValidationConfig(
              allActionValidationConfig,
            );
          }
          dataTree = {};
          const updateResponse = dataTreeEvaluator.updateDataTree(evalOrder);
          dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
          // evalMetaUpdates can have moment object as value which will cause DataCloneError
          // hence, stringify and parse to avoid such errors
          evalMetaUpdates = JSON.parse(
            JSON.stringify(updateResponse.evalMetaUpdates),
          );
        }
        dataTreeEvaluator = dataTreeEvaluator as DataTreeEvaluator;
        dependencies = dataTreeEvaluator.inverseDependencyMap;
        errors = dataTreeEvaluator.errors;
        dataTreeEvaluator.clearErrors();
        logs = dataTreeEvaluator.logs;
        userLogs = dataTreeEvaluator.userLogs;
        if (shouldReplay) {
          if (replayMap[CANVAS]?.logs)
            logs = logs.concat(replayMap[CANVAS]?.logs);
          replayMap[CANVAS]?.clearLogs();
        }

        dataTreeEvaluator.clearLogs();
      } catch (error) {
        console.error("Yes, ERROR IN EVAL_TREE", error);
        if (dataTreeEvaluator !== undefined) {
          errors = dataTreeEvaluator.errors;
          logs = dataTreeEvaluator.logs;
          userLogs = dataTreeEvaluator.userLogs;
        }
        if (!(error instanceof CrashingError)) {
          errors.push({
            type: EvalErrorTypes.UNKNOWN_ERROR,
            message: (error as Error).message,
          });
          console.error(error);
        }
        dataTree = getSafeToRenderDataTree(
          getUpdatedLocalUnEvalTreeAfterJSUpdates(jsUpdates, unevalTree),
          widgetTypeConfigMap,
        );
      }
      return {
        dataTree,
        dependencies,
        errors,
        logs,
        userLogs,
        evalMetaUpdates,
        isCreateFirstTree: isFirstTree,
      } as EvalTreeResponseData;
    }
    case EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS: {
      const { bindings, executionParams } = requestData;
      if (!dataTreeEvaluator) {
        return { values: undefined, errors: [] };
      }

      const values = dataTreeEvaluator.evaluateActionBindings(
        bindings,
        executionParams,
      );

      const cleanValues = removeFunctions(values);

      const errors = dataTreeEvaluator.errors;
      dataTreeEvaluator.clearErrors();
      return { values: cleanValues, errors };
    }
    case EVAL_WORKER_ACTIONS.EVAL_TRIGGER: {
      const {
        callbackData,
        dataTree,
        dynamicTrigger,
        eventType,
        globalContext,
        triggerMeta,
      } = requestData;
      if (!dataTreeEvaluator) {
        return { triggers: [], errors: [] };
      }
      const { evalOrder } = dataTreeEvaluator.setupUpdateTree(dataTree);
      dataTreeEvaluator.updateDataTree(evalOrder);
      const evalTree = dataTreeEvaluator.evalTree;
      const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

      dataTreeEvaluator.evaluateTriggers(
        dynamicTrigger,
        evalTree,
        requestId,
        resolvedFunctions,
        callbackData,
        {
          globalContext,
          eventType,
          triggerMeta,
        },
      );

      break;
    }
    case EVAL_WORKER_ACTIONS.PROCESS_TRIGGER:
      /**
       * This action will not be processed here. This is handled in the eval trigger sub steps
       * @link promisifyAction
       **/
      break;
    case EVAL_WORKER_ACTIONS.CLEAR_CACHE: {
      dataTreeEvaluator = undefined;
      return true;
    }
    case EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY: {
      const { property, props, validation, value } = requestData;
      return removeFunctions(
        validateWidgetProperty(validation, value, props, property),
      );
    }
    case EVAL_WORKER_ACTIONS.UNDO: {
      const { entityId } = requestData;
      if (!replayMap[entityId || CANVAS]) return;
      const replayResult = replayMap[entityId || CANVAS].replay("UNDO");
      replayMap[entityId || CANVAS].clearLogs();
      return replayResult;
    }
    case EVAL_WORKER_ACTIONS.REDO: {
      const { entityId } = requestData;
      if (!replayMap[entityId ?? CANVAS]) return;
      const replayResult = replayMap[entityId ?? CANVAS].replay("REDO");
      replayMap[entityId ?? CANVAS].clearLogs();
      return replayResult;
    }
    case EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS: {
      const { functionCall } = requestData;

      if (!dataTreeEvaluator) {
        return true;
      }
      const evalTree = dataTreeEvaluator.evalTree;
      const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;
      const { errors, logs, result } = evaluate(
        functionCall,
        evalTree,
        resolvedFunctions,
        false,
        undefined,
      );
      return { errors, logs, result };
    }
    case EVAL_WORKER_ACTIONS.EVAL_EXPRESSION:
      const { expression, isTrigger } = requestData;
      const evalTree = dataTreeEvaluator?.evalTree;
      if (!evalTree) return {};
      // TODO find a way to do this for snippets
      return isTrigger
        ? evaluateAsync(expression, evalTree, "SNIPPET", {})
        : evaluate(expression, evalTree, {}, false);
    case EVAL_WORKER_ACTIONS.UPDATE_REPLAY_OBJECT:
      const { entity, entityId, entityType } = requestData;
      const replayObject = replayMap[entityId];
      if (replayObject) {
        replayObject.update(entity);
      } else {
        replayMap[entityId] = new ReplayEditor(entity, entityType);
      }
      break;
    case EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION:
      const { version } = requestData;
      self.evaluationVersion = version || 1;
      break;
    case EVAL_WORKER_ACTIONS.INIT_FORM_EVAL:
      const { currentEvalState, payload, type } = requestData;
      const response = setFormEvaluationSaga(type, payload, currentEvalState);
      return response;

    case EVAL_WORKER_ACTIONS.UPDATE_DEPENDENCY: {
      let evalOrder: string[] = [];
      let lintOrder: string[] = [];
      let jsUpdates: Record<string, JSUpdate> = {};
      let unEvalUpdates: DataTreeDiff[] = [];

      const {
        allActionValidationConfig,
        shouldReplay,
        theme,
        unevalTree,
        widgets,
        widgetTypeConfigMap,
      } = requestData as UpdateDependencyRequestData;
      try {
        if (!dataTreeEvaluator) {
          isFirstTree = true;
          replayMap = replayMap || {};
          replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
          dataTreeEvaluator = new DataTreeEvaluator(
            widgetTypeConfigMap,
            allActionValidationConfig,
          );
          const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
            unevalTree,
          );
          evalOrder = setupFirstTreeResponse.evalOrder;
          lintOrder = setupFirstTreeResponse.lintOrder;
          jsUpdates = setupFirstTreeResponse.jsUpdates;
        } else if (dataTreeEvaluator.hasCyclicalDependency) {
          if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
            //allActionValidationConfigs may not be set in dataTreeEvaluatior. Therefore, set it explicitly via setter method
            dataTreeEvaluator.setAllActionValidationConfig(
              allActionValidationConfig,
            );
          }
          if (shouldReplay) {
            replayMap[CANVAS]?.update({ widgets, theme });
          }
          dataTreeEvaluator = new DataTreeEvaluator(
            widgetTypeConfigMap,
            allActionValidationConfig,
          );
          if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
            dataTreeEvaluator.setAllActionValidationConfig(
              allActionValidationConfig,
            );
          }
          const setupFirstTreeResponse = dataTreeEvaluator.setupFirstTree(
            unevalTree,
          );
          isFirstTree = true;
          evalOrder = setupFirstTreeResponse.evalOrder;
          lintOrder = setupFirstTreeResponse.lintOrder;
          jsUpdates = setupFirstTreeResponse.jsUpdates;
        } else {
          isFirstTree = false;
          if (shouldReplay) {
            replayMap[CANVAS]?.update({ widgets, theme });
          }
          const setupUpdateTreeResponse = dataTreeEvaluator.setupUpdateTree(
            unevalTree,
          );
          evalOrder = setupUpdateTreeResponse.evalOrder;
          lintOrder = setupUpdateTreeResponse.lintOrder;
          unEvalUpdates = setupUpdateTreeResponse.unEvalUpdates;
        }
      } catch (error) {
        console.error("Yes, ERROR IN UPDATING DEPENDENCY", error);
        unEvalUpdates = [];
        evalOrder = [];
        lintOrder = [];
      }

      return {
        evalOrder,
        lintOrder,
        jsUpdates,
        unEvalUpdates,
      } as UpdateDependencyResponseData;
    }
    default: {
      console.error("Action not registered on worker", method);
    }
  }
}

addEventListener("message", messageEventListener(eventRequestHandler));

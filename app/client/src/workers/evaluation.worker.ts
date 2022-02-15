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
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import ReplayEntity from "entities/Replay";
import evaluate, {
  evaluateAsync,
  setupEvaluationEnvironment,
} from "workers/evaluate";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import ReplayEditor from "entities/Replay/ReplayEntity/ReplayEditor";
import { setFormEvaluationSaga } from "./formEval";
import { isEmpty } from "lodash";

const CANVAS = "canvas";

const ctx: Worker = self as any;

export let dataTreeEvaluator: DataTreeEvaluator | undefined;

let replayMap: Record<string, ReplayEntity<any>>;

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (
    message: EVAL_WORKER_ACTIONS,
    requestData: any,
    requestId: string,
  ) => any,
) {
  return (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestData, requestId } = e.data;
    if (method) {
      const responseData = fn(method, requestData, requestId);
      if (responseData) {
        const endTime = performance.now();
        try {
          ctx.postMessage({
            requestId,
            responseData,
            timeTaken: (endTime - startTime).toFixed(2),
          });
        } catch (e) {
          console.error(e);
          // we dont want to log dataTree because it is huge.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { dataTree, ...rest } = requestData;
          ctx.postMessage({
            requestId,
            responseData: {
              errors: [
                {
                  type: EvalErrorTypes.CLONE_ERROR,
                  message: e,
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

ctx.addEventListener(
  "message",
  messageEventListener((method, requestData: any, requestId) => {
    switch (method) {
      case EVAL_WORKER_ACTIONS.SETUP: {
        setupEvaluationEnvironment();
        return true;
      }
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const {
          allActionValidationConfig,
          shouldReplay = true,
          unevalTree,
          widgets,
          widgetTypeConfigMap,
        } = requestData;

        let dataTree: DataTree = unevalTree;
        let errors: EvalError[] = [];
        let logs: any[] = [];
        let dependencies: DependencyMap = {};
        let evaluationOrder: string[] = [];
        let unEvalUpdates: DataTreeDiff[] = [];
        let jsUpdates: Record<string, any> = {};
        try {
          if (!dataTreeEvaluator) {
            replayMap = replayMap || {};
            replayMap[CANVAS] = new ReplayCanvas(widgets);
            //allActionValidationConfigs maybe empty
            dataTreeEvaluator = new DataTreeEvaluator(
              widgetTypeConfigMap,
              allActionValidationConfig,
            );
            const dataTreeResponse = dataTreeEvaluator.createFirstTree(
              unevalTree,
            );
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            dataTree = dataTreeResponse.evalTree;
            jsUpdates = dataTreeResponse.jsUpdates;
            // We need to clean it to remove any possible functions inside the tree.
            // If functions exist, it will crash the web worker
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else if (dataTreeEvaluator.hasCyclicalDependency) {
            if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
              //allActionValidationConfigs may not be set in dataTreeEvaluatior. Therefore, set it explicitly via setter method
              dataTreeEvaluator.setAllActionValidationConfig(
                allActionValidationConfig,
              );
            }
            if (shouldReplay) {
              replayMap[CANVAS]?.update(widgets);
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
            const dataTreeResponse = dataTreeEvaluator.createFirstTree(
              unevalTree,
            );
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            dataTree = dataTreeResponse.evalTree;
            jsUpdates = dataTreeResponse.jsUpdates;
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else {
            if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
              dataTreeEvaluator.setAllActionValidationConfig(
                allActionValidationConfig,
              );
            }
            dataTree = {};
            if (shouldReplay) {
              replayMap[CANVAS]?.update(widgets);
            }
            const updateResponse = dataTreeEvaluator.updateDataTree(unevalTree);
            evaluationOrder = updateResponse.evaluationOrder;
            unEvalUpdates = updateResponse.unEvalUpdates;
            dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
            jsUpdates = updateResponse.jsUpdates;
          }
          dependencies = dataTreeEvaluator.inverseDependencyMap;
          errors = dataTreeEvaluator.errors;
          dataTreeEvaluator.clearErrors();
          logs = dataTreeEvaluator.logs;
          if (replayMap[CANVAS]?.logs)
            logs = logs.concat(replayMap[CANVAS]?.logs);
          replayMap[CANVAS]?.clearLogs();
          dataTreeEvaluator.clearLogs();
        } catch (e) {
          if (dataTreeEvaluator !== undefined) {
            errors = dataTreeEvaluator.errors;
            logs = dataTreeEvaluator.logs;
          }
          if (!(e instanceof CrashingError)) {
            errors.push({
              type: EvalErrorTypes.UNKNOWN_ERROR,
              message: e.message,
            });
            console.error(e);
          }
          dataTree = getSafeToRenderDataTree(unevalTree, widgetTypeConfigMap);
        }
        return {
          dataTree,
          dependencies,
          errors,
          evaluationOrder,
          logs,
          unEvalUpdates,
          jsUpdates,
        };
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
        const { callbackData, dataTree, dynamicTrigger } = requestData;
        if (!dataTreeEvaluator) {
          return { triggers: [], errors: [] };
        }
        dataTreeEvaluator.updateDataTree(dataTree);
        const evalTree = dataTreeEvaluator.evalTree;
        const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

        dataTreeEvaluator.evaluateTriggers(
          dynamicTrigger,
          evalTree,
          requestId,
          resolvedFunctions,
          callbackData,
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
        const { props, validation, value } = requestData;
        return removeFunctions(
          validateWidgetProperty(validation, value, props),
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
        const { errors, result } = evaluate(
          functionCall,
          evalTree,
          resolvedFunctions,
          false,
          undefined,
        );
        return { errors, result };
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
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

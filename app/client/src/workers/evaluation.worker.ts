import {
  DataTree,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import {
  DependencyMap,
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
  EvaluationError,
  PropertyEvaluationErrorType,
  EVAL_ERROR_PATH,
} from "utils/DynamicBindingUtils";
import {
  CrashingError,
  DataTreeDiff,
  getSafeToRenderDataTree,
  removeFunctions,
  validateWidgetProperty,
  parseJSCollection,
} from "./evaluationUtils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import ReplayEntity from "workers/ReplayDSL";
import evaluate, { setupEvaluationEnvironment } from "workers/evaluate";
import { Severity } from "entities/AppsmithConsole";
import _ from "lodash";
import { Action } from "entities/Action";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { JSAction } from "entities/JSCollection";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;

let replayMap: Record<
  string,
  ReplayEntity<CanvasWidgetsReduxState | Action | JSAction>
>;

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (message: EVAL_WORKER_ACTIONS, requestData: any) => void,
) {
  return (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestData, requestId } = e.data;
    const responseData = fn(method, requestData);
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
  };
}

ctx.addEventListener(
  "message",
  messageEventListener((method, requestData: any) => {
    switch (method) {
      case EVAL_WORKER_ACTIONS.SETUP: {
        setupEvaluationEnvironment();
        return true;
      }
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const {
          actions,
          jsObjects,
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
        try {
          if (!dataTreeEvaluator) {
            replayMap = replayMap || {};
            replayMap["canvas"] = new ReplayEntity<CanvasWidgetsReduxState>(
              widgets,
            );
            actions.forEach((action: any) => {
              replayMap[action.config.id] = new ReplayEntity<Action>(
                action.config,
              );
            });
            jsObjects.forEach((jsObject: any) => {
              replayMap[jsObject.config.id] = new ReplayEntity<JSAction>(
                jsObject.config,
              );
            });
            dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
            dataTree = dataTreeEvaluator.createFirstTree(unevalTree);
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            // We need to clean it to remove any possible functions inside the tree.
            // If functions exist, it will crash the web worker
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else {
            dataTree = {};
            if (shouldReplay) {
              replayMap["canvas"]?.update(widgets);
              actions.forEach((action: any) => {
                replayMap[action.config.id] =
                  replayMap[action.config.id] ||
                  new ReplayEntity<Action>(action.config);
                replayMap[action.config.id]?.update(action.config);
              });
              jsObjects.forEach((jsObject: any) => {
                replayMap[jsObject.config.id] =
                  replayMap[jsObject.config.id] ||
                  new ReplayEntity<JSAction>(jsObject.config);
                replayMap[jsObject.config.id]?.update(jsObject.config);
              });
            }
            const updateResponse = dataTreeEvaluator.updateDataTree(unevalTree);
            evaluationOrder = updateResponse.evaluationOrder;
            unEvalUpdates = updateResponse.unEvalUpdates;
            dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
          }
          dependencies = dataTreeEvaluator.inverseDependencyMap;
          errors = dataTreeEvaluator.errors;
          dataTreeEvaluator.clearErrors();
          logs = dataTreeEvaluator.logs;
          if (replayMap["canvas"]?.logs)
            logs = logs.concat(replayMap["canvas"]?.logs);
          replayMap["canvas"]?.clearLogs();
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
          dataTreeEvaluator = undefined;
        }
        return {
          dataTree,
          dependencies,
          errors,
          evaluationOrder,
          logs,
          unEvalUpdates,
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
        const {
          callbackData,
          dataTree,
          dynamicTrigger,
          fullPropertyPath,
        } = requestData;
        if (!dataTreeEvaluator) {
          return { triggers: [], errors: [] };
        }
        dataTreeEvaluator.updateDataTree(dataTree);
        const evalTree = dataTreeEvaluator.evalTree;
        const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;
        const {
          errors: evalErrors,
          result,
          triggers,
        }: {
          errors: EvaluationError[];
          triggers: Array<any>;
          result: any;
        } = dataTreeEvaluator.getDynamicValue(
          dynamicTrigger,
          evalTree,
          resolvedFunctions,
          EvaluationSubstitutionType.TEMPLATE,
          true,
          callbackData,
          fullPropertyPath,
        );
        const cleanTriggers = removeFunctions(triggers);
        const cleanResult = removeFunctions(result);
        // Transforming eval errors into eval trigger errors. Since trigger
        // errors occur less, we want to treat it separately
        const errors = evalErrors
          .filter(
            (error) => error.errorType === PropertyEvaluationErrorType.PARSE,
          )
          .map((error) => ({
            ...error,
            message: error.errorMessage,
            type: EvalErrorTypes.EVAL_TRIGGER_ERROR,
          }));
        return { triggers: cleanTriggers, errors, result: cleanResult };
      }
      case EVAL_WORKER_ACTIONS.CLEAR_CACHE: {
        dataTreeEvaluator = undefined;
        return true;
      }
      case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE: {
        const { propertyPath } = requestData;
        if (!dataTreeEvaluator) {
          return true;
        }
        dataTreeEvaluator.clearPropertyCache(propertyPath);
        return true;
      }
      case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE_OF_WIDGET: {
        const { widgetName } = requestData;
        if (!dataTreeEvaluator) {
          return true;
        }
        dataTreeEvaluator.clearPropertyCacheOfWidget(widgetName);
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
        if (!replayMap[entityId || "canvas"]) return;
        const replayResult = replayMap[entityId || "canvas"].replay("UNDO");
        replayMap[entityId || "canvas"].clearLogs();
        return replayResult;
      }
      case EVAL_WORKER_ACTIONS.REDO: {
        const { entityId } = requestData;
        if (!replayMap[entityId ?? "canvas"]) return;
        const replayResult = replayMap[entityId ?? "canvas"].replay("REDO");
        replayMap[entityId ?? "canvas"].clearLogs();
        return replayResult;
      }
      case EVAL_WORKER_ACTIONS.PARSE_JS_FUNCTION_BODY: {
        const { body, jsAction } = requestData;
        /**
         * In case of a cyclical dependency, the dataTreeEvaluator will not
         * be present. This causes an issue because evalTree is needed to resolve
         * the cyclical dependency in a JS Collection
         *
         * By setting evalTree to an empty object, the parsing can still take place
         * and it would resolve the cyclical dependency
         * **/
        const currentEvalTree = dataTreeEvaluator
          ? dataTreeEvaluator.evalTree
          : {};
        try {
          const { evalTree, result } = parseJSCollection(
            body,
            jsAction,
            currentEvalTree,
          );
          return {
            evalTree,
            result,
          };
        } catch (e) {
          const errors = [
            {
              errorType: PropertyEvaluationErrorType.PARSE,
              raw: "",
              severity: Severity.ERROR,
              errorMessage: e.message,
            },
          ];
          _.set(
            currentEvalTree,
            `${jsAction.name}.${EVAL_ERROR_PATH}.body`,
            errors,
          );
          return {
            currentEvalTree,
          };
        }
      }
      case EVAL_WORKER_ACTIONS.EVAL_JS_FUNCTION: {
        const { action, collectionName } = requestData;

        if (!dataTreeEvaluator) {
          return true;
        }
        const evalTree = dataTreeEvaluator.evalTree;
        const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;
        const path = collectionName + "." + action.name + "()";
        const { result } = evaluate(
          path,
          evalTree,
          resolvedFunctions,
          undefined,
          true,
        );
        return result;
      }
      case EVAL_WORKER_ACTIONS.EVAL_EXPRESSION:
        const { expression, isTrigger } = requestData;
        const evalTree = dataTreeEvaluator?.evalTree;
        if (!evalTree) return {};
        return isTrigger
          ? evaluate(expression, evalTree, {}, [], true)
          : evaluate(expression, evalTree, {});
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

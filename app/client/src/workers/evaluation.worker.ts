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
import ReplayDSL from "workers/ReplayDSL";
import evaluate from "workers/evaluate";
import { Severity } from "entities/AppsmithConsole";
import _ from "lodash";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;
let replayDSL: ReplayDSL | undefined;

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
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const {
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
            replayDSL = new ReplayDSL(widgets);
            dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
            dataTree = dataTreeEvaluator.createFirstTree(unevalTree);
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            // We need to clean it to remove any possible functions inside the tree.
            // If functions exist, it will crash the web worker
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else {
            dataTree = {};
            shouldReplay && replayDSL?.update(widgets);
            const updateResponse = dataTreeEvaluator.updateDataTree(unevalTree);
            evaluationOrder = updateResponse.evaluationOrder;
            unEvalUpdates = updateResponse.unEvalUpdates;
            dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
          }
          dependencies = dataTreeEvaluator.inverseDependencyMap;
          errors = dataTreeEvaluator.errors;
          dataTreeEvaluator.clearErrors();
          logs = dataTreeEvaluator.logs;
          if (replayDSL?.logs) logs = logs.concat(replayDSL?.logs);
          replayDSL?.clearLogs();
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
        return { triggers: cleanTriggers, errors, result };
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
        if (!replayDSL) return;

        const replayResult = replayDSL.replay("UNDO");
        replayDSL.clearLogs();
        return replayResult;
      }
      case EVAL_WORKER_ACTIONS.REDO: {
        if (!replayDSL) return;

        const replayResult = replayDSL.replay("REDO");
        replayDSL.clearLogs();
        return replayResult;
      }
      case EVAL_WORKER_ACTIONS.PARSE_JS_FUNCTION_BODY: {
        const { body, jsAction } = requestData;

        if (!dataTreeEvaluator) {
          return true;
        }
        try {
          const { errors, evalTree, result } = parseJSCollection(
            body,
            jsAction,
            dataTreeEvaluator.evalTree,
          );
          return {
            errors,
            evalTree,
            result,
          };
        } catch (e) {
          const evalTree = dataTreeEvaluator.evalTree;
          const errors = [
            {
              errorType: PropertyEvaluationErrorType.PARSE,
              raw: "",
              severity: Severity.ERROR,
              errorMessage: e.message,
            },
          ];
          _.set(evalTree, `${jsAction.name}.${EVAL_ERROR_PATH}.body`, errors);
          return {
            errors,
            evalTree,
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

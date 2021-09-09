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
  getParams,
} from "./evaluationUtils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import evaluate, { evaluateAsync } from "./evaluate";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;

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
    const responseData = fn(method, requestData, requestId);
    if (responseData) {
      const endTime = performance.now();
      ctx.postMessage({
        requestId,
        responseData,
        timeTaken: (endTime - startTime).toFixed(2),
      });
    }
  };
}

ctx.addEventListener(
  "message",
  messageEventListener((method, requestData: any, requestId) => {
    switch (method) {
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const { unevalTree, widgetTypeConfigMap } = requestData;
        let dataTree: DataTree = unevalTree;
        let errors: EvalError[] = [];
        let logs: any[] = [];
        let dependencies: DependencyMap = {};
        let evaluationOrder: string[] = [];
        let unEvalUpdates: DataTreeDiff[] = [];
        try {
          if (!dataTreeEvaluator) {
            dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
            dataTree = dataTreeEvaluator.createFirstTree(unevalTree);
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            // We need to clean it to remove any possible functions inside the tree.
            // If functions exist, it will crash the web worker
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else {
            dataTree = {};
            const updateResponse = dataTreeEvaluator.updateDataTree(unevalTree);
            evaluationOrder = updateResponse.evaluationOrder;
            unEvalUpdates = updateResponse.unEvalUpdates;
            dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
          }
          dependencies = dataTreeEvaluator.inverseDependencyMap;
          errors = dataTreeEvaluator.errors;
          dataTreeEvaluator.clearErrors();
          logs = dataTreeEvaluator.logs;
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
        const { dataTree, dynamicTrigger, fullPropertyPath } = requestData;
        if (!dataTreeEvaluator) {
          return { triggers: [], errors: [] };
        }
        dataTreeEvaluator.updateDataTree(dataTree);
        const evalTree = dataTreeEvaluator.evalTree;
        const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

        dataTreeEvaluator.evaluateTriggers(dynamicTrigger, evalTree, requestId);

        break;
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
      case EVAL_WORKER_ACTIONS.PARSE_JS_FUNCTION_BODY: {
        const { body, jsAction } = requestData;
        const regex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);

        if (!dataTreeEvaluator) {
          return true;
        }
        try {
          const correctFormat = regex.test(body);
          if (correctFormat) {
            const toBeParsedBody = body.replace(/export default/g, "");
            const parsed = body && eval("(" + toBeParsedBody + ")");
            const parsedLength = Object.keys(parsed).length;
            const actions = [];
            const variables = [];
            if (parsedLength > 0) {
              for (const key in parsed) {
                if (parsed.hasOwnProperty(key)) {
                  if (typeof parsed[key] === "function") {
                    const value = parsed[key];
                    const params = getParams(value);
                    actions.push({
                      name: key,
                      body: parsed[key].toString(),
                      arguments: params,
                    });
                  } else {
                    variables.push({
                      name: key,
                      value: parsed[key],
                    });
                  }
                }
              }
            }
            return {
              actions: actions,
              variables: variables,
            };
          } else {
            throw new Error("syntax error");
          }
        } catch (e) {
          const errors = dataTreeEvaluator.errors;
          errors.push({
            type: EvalErrorTypes.PARSE_JS_ERROR,
            message: e.message,
            context: jsAction,
          });
          return errors;
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
        // TODO find a way to do this for snippets
        return isTrigger
          ? evaluateAsync(expression, evalTree, {}, "SNIPPET")
          : evaluate(expression, evalTree, {});
      case EVAL_WORKER_ACTIONS.PROCESS_TRIGGER:
        // This action will not be processed here. This is handled in the eval trigger sub steps
        break;
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

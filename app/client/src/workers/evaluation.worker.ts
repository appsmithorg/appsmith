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
} from "utils/DynamicBindingUtils";
import {
  CrashingError,
  getSafeToRenderDataTree,
  removeFunctions,
  validateWidgetProperty,
  getParams,
} from "./evaluationUtils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { Diff } from "deep-diff";
import evaluate from "workers/evaluate";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (message: EVAL_WORKER_ACTIONS, requestData: any) => void,
) {
  return (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestData, requestId } = e.data;
    const responseData = fn(method, requestData);
    const endTime = performance.now();
    ctx.postMessage({
      requestId,
      responseData,
      timeTaken: (endTime - startTime).toFixed(2),
    });
  };
}

ctx.addEventListener(
  "message",
  messageEventListener((method, requestData: any) => {
    switch (method) {
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const { unevalTree, widgetTypeConfigMap } = requestData;
        let dataTree: DataTree = unevalTree;
        let errors: EvalError[] = [];
        let logs: any[] = [];
        let dependencies: DependencyMap = {};
        let updates: Diff<DataTree, DataTree>[] = [];
        let evaluationOrder: string[] = [];
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
            updates = JSON.parse(JSON.stringify(updateResponse.updates));
            evaluationOrder = updateResponse.evaluationOrder;
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
          updates,
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
        const {
          errors: evalErrors,
          triggers,
        }: {
          errors: EvaluationError[];
          triggers: Array<any>;
        } = dataTreeEvaluator.getDynamicValue(
          dynamicTrigger,
          evalTree,
          EvaluationSubstitutionType.TEMPLATE,
          true,
          callbackData,
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
        return { triggers: cleanTriggers, errors };
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
        const { property, props, validation, value } = requestData;
        return removeFunctions(
          validateWidgetProperty(property, value, props, validation),
        );
      }
      case EVAL_WORKER_ACTIONS.PARSE_JS_FUNCTION_BODY: {
        const { body } = requestData;

        if (!dataTreeEvaluator) {
          return true;
        }
        try {
          const parsed = body && eval("(" + body + ")");
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
        } catch (e) {
          const errors = dataTreeEvaluator.errors;
          errors.push({
            type: EvalErrorTypes.PARSE_JS_ERROR,
            message: e.message,
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
        const path = collectionName + "." + action.name + "()";
        const { result } = evaluate(path, evalTree);
        return result;
      }
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

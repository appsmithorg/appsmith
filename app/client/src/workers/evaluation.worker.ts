import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  DependencyMap,
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
} from "utils/DynamicBindingUtils";
import {
  CrashingError,
  getValidatedTree,
  removeFunctions,
  validateWidgetProperty,
} from "./evaluationUtils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (message: EVAL_WORKER_ACTIONS, requestData: any) => void,
) {
  return (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestId, requestData } = e.data;
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
        const { widgetTypeConfigMap, unevalTree } = requestData;
        let dataTree: DataTree = unevalTree;
        let errors: EvalError[] = [];
        let logs: any[] = [];
        let dependencies: DependencyMap = {};
        try {
          if (!dataTreeEvaluator) {
            dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
            dataTreeEvaluator.createFirstTree(unevalTree);
            dataTree = dataTreeEvaluator.evalTree;
          } else {
            dataTree = dataTreeEvaluator.updateDataTree(unevalTree);
          }

          // We need to clean it to remove any possible functions inside the tree.
          // If functions exist, it will crash the web worker
          dataTree = JSON.parse(JSON.stringify(dataTree));
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
          dataTree = getValidatedTree(widgetTypeConfigMap, unevalTree);
          dataTreeEvaluator = undefined;
        }
        return {
          dataTree,
          dependencies,
          errors,
          logs,
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
        const { dynamicTrigger, callbackData, dataTree } = requestData;
        if (!dataTreeEvaluator) {
          return { triggers: [], errors: [] };
        }
        const evalTree = dataTreeEvaluator.updateDataTree(dataTree);
        const triggers = dataTreeEvaluator.getDynamicValue(
          dynamicTrigger,
          evalTree,
          true,
          callbackData,
        );
        const cleanTriggers = removeFunctions(triggers);
        // Transforming eval errors into eval trigger errors. Since trigger
        // errors occur less, we want to treat it separately
        const errors = dataTreeEvaluator.errors.map((error) => {
          if (error.type === EvalErrorTypes.EVAL_ERROR) {
            return {
              ...error,
              type: EvalErrorTypes.EVAL_TRIGGER_ERROR,
            };
          }
          return error;
        });
        dataTreeEvaluator.clearErrors();
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
        const {
          widgetType,
          widgetTypeConfigMap,
          property,
          value,
          props,
        } = requestData;
        return removeFunctions(
          validateWidgetProperty(
            widgetTypeConfigMap,
            widgetType,
            property,
            value,
            props,
          ),
        );
      }
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { getAllAsyncFunctions } from "@appsmith/workers/Evaluation/Actions";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorCategory } from "utils/DynamicBindingUtils";
import type DependencyMap from "entities/DependencyMap";
import {
  getAllAsyncJSFunctions,
  isDataField,
} from "workers/common/DataTreeEvaluator/utils";
import { jsPropertiesState } from "./JSObject/jsPropertiesState";
import { isEmpty } from "lodash";

const FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE =
  "Found an action invocation during evaluation. Data fields cannot execute actions.";
const UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR =
  "Found a reference to {{actionName}} during evaluation. Data fields cannot execute framework actions. Please remove any direct/indirect references to {{actionName}} and try again.";
class ErrorModifier {
  private errorNamesToScan = ["ReferenceError", "TypeError"];
  private asyncFunctionsNameMap: Record<string, true> = {};
  private asyncJSFunctionsNames: string[] = [];
  updateAsyncFunctions(
    dataTree: DataTree,
    configTree: ConfigTree,
    dependencyMap: DependencyMap,
  ) {
    const allAsyncEntityFunctions = getAllAsyncFunctions(dataTree, configTree);
    const allAsyncJSFunctions = getAllAsyncJSFunctions(
      dataTree,
      jsPropertiesState.getMap(),
      dependencyMap,
      Object.keys(allAsyncEntityFunctions),
    );
    this.asyncFunctionsNameMap = allAsyncEntityFunctions;
    this.asyncJSFunctionsNames = allAsyncJSFunctions;
  }

  run(error: Error): {
    errorMessage: ReturnType<typeof getErrorMessage>;
    errorCategory?: PropertyEvaluationErrorCategory;
  } {
    const errorMessage = getErrorMessage(error);
    if (
      error instanceof FoundPromiseInSyncEvalError ||
      error instanceof ActionCalledInSyncFieldError
    ) {
      return {
        errorMessage,
        errorCategory:
          PropertyEvaluationErrorCategory.INVALID_JS_FUNCTION_INVOCATION_IN_DATA_FIELD,
      };
    }

    if (!this.errorNamesToScan.includes(error.name)) return { errorMessage };

    for (const asyncFunctionFullPath of Object.keys(
      this.asyncFunctionsNameMap,
    )) {
      const functionNameWithWhiteSpace = " " + asyncFunctionFullPath + " ";
      if (getErrorMessageWithType(error).match(functionNameWithWhiteSpace)) {
        return {
          errorMessage: {
            name: "ValidationError",
            message: UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR.replaceAll(
              "{{actionName}}",
              asyncFunctionFullPath + "()",
            ),
          },
          errorCategory:
            PropertyEvaluationErrorCategory.INVALID_JS_FUNCTION_INVOCATION_IN_DATA_FIELD,
        };
      }
    }

    return { errorMessage };
  }
  setAsyncInvocationErrorsRootcause(
    errors: EvaluationError[],
    asyncFunc: string,
  ) {
    return errors.map((error) => {
      if (isAsyncFunctionCalledInSyncFieldError(error)) {
        error.errorMessage.message = FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE;
        error.kind = {
          category:
            PropertyEvaluationErrorCategory.INVALID_JS_FUNCTION_INVOCATION_IN_DATA_FIELD,
          rootcause: asyncFunc,
        };
      }
      return error;
    });
  }
  addRootcauseToAsyncInvocationErrors(
    fullPropertyPath: string,
    configTree: ConfigTree,
    errors: EvaluationError[],
    dependencyMap: DependencyMap,
  ) {
    let updatedErrors = errors;

    if (isDataField(fullPropertyPath, configTree)) {
      const reachableAsyncJSFunctions = dependencyMap.getAllReachableNodes(
        fullPropertyPath,
        this.asyncJSFunctionsNames,
      );

      if (!isEmpty(reachableAsyncJSFunctions))
        updatedErrors = errorModifier.setAsyncInvocationErrorsRootcause(
          errors,
          reachableAsyncJSFunctions[0],
        );
    }
    return updatedErrors;
  }
}

export const errorModifier = new ErrorModifier();

const FOUND_PROMISE_IN_SYNC_EVAL_MESSAGE =
  "Found a Promise() during evaluation. Data fields cannot execute asynchronous code.";

export class FoundPromiseInSyncEvalError extends Error {
  constructor() {
    super();
    this.name = "";
    this.message = FOUND_PROMISE_IN_SYNC_EVAL_MESSAGE;
  }
}

export class ActionCalledInSyncFieldError extends Error {
  constructor(actionName: string) {
    super(actionName);

    if (!actionName) {
      this.message = "Async function called in a data field";
      return;
    }

    this.name = "";
    this.message = UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR.replaceAll(
      "{{actionName}}",
      actionName + "()",
    );
  }
}

export const getErrorMessage = (error: Error, name = "ValidationError") => {
  return error.name
    ? {
        name: error.name,
        message: error.message,
      }
    : {
        name,
        message: error.message,
      };
};

export const getErrorMessageWithType = (error: Error) => {
  return error.name ? `${error.name}: ${error.message}` : error.message;
};

function isAsyncFunctionCalledInSyncFieldError(error: EvaluationError) {
  return (
    error.kind?.category ===
    PropertyEvaluationErrorCategory.INVALID_JS_FUNCTION_INVOCATION_IN_DATA_FIELD
  );
}

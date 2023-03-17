import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { getAllAsyncFunctions } from "@appsmith/workers/Evaluation/Actions";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorCategory } from "utils/DynamicBindingUtils";

const FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE =
  "Found an async invocation during evaluation. Sync fields cannot execute asynchronous code.";
class ErrorModifier {
  private errorNamesToScan = ["ReferenceError", "TypeError"];
  // Note all regex below groups the async function name

  private asyncFunctionsNameMap: Record<string, true> = {};

  updateAsyncFunctions(dataTree: DataTree) {
    this.asyncFunctionsNameMap = getAllAsyncFunctions(dataTree);
  }

  run(error: Error) {
    const errorMessage = getErrorMessage(error);

    if (!this.errorNamesToScan.includes(error.name)) return errorMessage;

    for (const asyncFunctionFullPath of Object.keys(
      this.asyncFunctionsNameMap,
    )) {
      const functionNameWithWhiteSpace = " " + asyncFunctionFullPath + " ";
      if (getErrorMessageWithType(error).match(functionNameWithWhiteSpace)) {
        return {
          name: "ValidationError",
          message: FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE,
        };
      }
    }

    return errorMessage;
  }
  modifyAsyncInvocationErrors(errors: EvaluationError[], asyncFunc: string) {
    return errors.map((error) => {
      if (isAsyncFunctionCalledInSyncFieldError(error)) {
        error.kind = {
          category:
            PropertyEvaluationErrorCategory.ASYNC_FUNCTION_INVOCATION_IN_DATA_FIELD,
          rootcause: asyncFunc,
        };
      }
      return error;
    });
  }
}

export const errorModifier = new ErrorModifier();

export class FoundPromiseInSyncEvalError extends Error {
  constructor() {
    super();
    this.name = "";
    this.message = FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE;
  }
}

export class ActionCalledInSyncFieldError extends Error {
  constructor(actionName: string) {
    super(actionName);

    if (!actionName) {
      this.message = "Async function called in a sync field";
      return;
    }

    this.name = "";
    this.message = FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE;
  }
}

export const getErrorMessage = (error: Error) => {
  return error.name
    ? {
        name: error.name,
        message: error.message,
      }
    : {
        name: "ValidationError",
        message: error.message,
      };
};

export const getErrorMessageWithType = (error: Error) => {
  return error.name ? `${error.name}: ${error.message}` : error.message;
};

function isAsyncFunctionCalledInSyncFieldError(error: EvaluationError) {
  return error.errorMessage.message === FOUND_ASYNC_IN_SYNC_EVAL_MESSAGE;
}

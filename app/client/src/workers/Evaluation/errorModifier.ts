import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { getAllAsyncFunctions } from "@appsmith/workers/Evaluation/Actions";

const UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR =
  "Found a reference to {{actionName}} during evaluation. Sync fields cannot execute framework actions. Please remove any direct/indirect references to {{actionName}} and try again.";

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
          message: UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR.replaceAll(
            "{{actionName}}",
            asyncFunctionFullPath + "()",
          ),
        };
      }
    }

    return errorMessage;
  }
}

export const errorModifier = new ErrorModifier();

export class FoundPromiseInSyncEvalError extends Error {
  constructor() {
    super();
    this.name = "";
    this.message =
      "Found a Promise() during evaluation. Sync fields cannot execute asynchronous code.";
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
    this.message = UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR.replaceAll(
      "{{actionName}}",
      actionName + "()",
    );
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

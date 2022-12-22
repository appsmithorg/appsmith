import { DataTree } from "entities/DataTree/dataTreeFactory";
import { getAllAsyncFunctions } from "./Actions";
import { get } from "lodash";

const UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR =
  "Found a reference to {{actionName}} during evaluation. Sync fields cannot execute framework actions. Please remove any direct/indirect references to {{actionName}} and try again.";

class TransformError {
  // Note all regex below groups the async function name
  private errorMessageRegexList = [
    /ReferenceError: Can't find variable: ([\w_]+)/, // ReferenceError message for safari
    /ReferenceError: ([\w_]+) is not defined/, // ReferenceError message for other browser
    /TypeError: ([\w_]+\.[\w_]+) is not a function/,
  ];

  private asyncFunctionsNameMap: Record<string, true> = {};

  updateAsyncFunctions(dataTree: DataTree) {
    this.asyncFunctionsNameMap = getAllAsyncFunctions(dataTree);
  }

  syncField(message: string) {
    for (let index = 0; index < this.errorMessageRegexList.length; index++) {
      const errorMessageRegex = this.errorMessageRegexList[index];
      const matchResult = message.match(errorMessageRegex);
      if (matchResult) {
        const referencedIdentifier = matchResult[1];
        if (get(this.asyncFunctionsNameMap, referencedIdentifier)) {
          return UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR.replaceAll(
            "{{actionName}}",
            referencedIdentifier + "()",
          );
        }
      }
    }

    return message;
  }
}

export const errorModifier = new TransformError();

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
  return error.name ? `${error.name}: ${error.message}` : error.message;
};

import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import { getAllAsyncFunctions } from "ee/workers/Evaluation/Actions";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorCategory } from "utils/DynamicBindingUtils";
import type DependencyMap from "entities/DependencyMap";
import {
  getAllAsyncJSFunctions,
  isDataField,
} from "workers/common/DataTreeEvaluator/utils";
import { jsPropertiesState } from "./JSObject/jsPropertiesState";
import { get, isEmpty, toPath } from "lodash";
import { APP_MODE } from "entities/App";
import { isAction } from "ee/workers/Evaluation/evaluationUtils";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { getMemberExpressionObjectFromProperty } from "@shared/ast";

interface ErrorMetaData {
  userScript: string;
  source: string;
}

interface ExtraData {
  tree: DataTree;
  asynFns: Record<string, true>;
  isViewMode: boolean;
}
type Modifier = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  metaData: ErrorMetaData & ExtraData,
) => Partial<{
  errorMessage: ReturnType<typeof getErrorMessage>;
  errorCategory: PropertyEvaluationErrorCategory;
  rootcause: string;
}>;

const FOUND_ACTION_IN_DATA_FIELD_EVAL_MESSAGE =
  "Found an action invocation during evaluation. Data fields cannot execute actions.";
const UNDEFINED_ACTION_IN_SYNC_EVAL_ERROR =
  "Please remove any direct/indirect references to {{actionName}} and try again. Data fields cannot execute framework actions.";

class ErrorModifier {
  private asyncFunctionsNameMap: Record<string, true> = {};
  private asyncJSFunctionsNames: string[] = [];
  private isViewMode = true;
  private dataTree: DataTree = {};

  init(appMode?: APP_MODE) {
    this.isViewMode = appMode !== APP_MODE.EDIT;
  }

  updateAsyncFunctions(
    dataTree: DataTree,
    configTree: ConfigTree,
    dependencyMap: DependencyMap,
  ) {
    if (this.isViewMode) return;

    const allAsyncEntityFunctions = getAllAsyncFunctions(dataTree, configTree);
    const allAsyncJSFunctions = getAllAsyncJSFunctions(
      dataTree,
      jsPropertiesState.getMap(),
      dependencyMap,
      Object.keys(allAsyncEntityFunctions),
    );

    this.asyncFunctionsNameMap = allAsyncEntityFunctions;
    this.asyncJSFunctionsNames = allAsyncJSFunctions;
    this.dataTree = dataTree;
  }
  run(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any,
    metaData: ErrorMetaData,
    modifiers: Modifier[],
  ): {
    errorMessage: ReturnType<typeof getErrorMessage>;
    errorCategory?: PropertyEvaluationErrorCategory;
    rootcause?: string;
  } {
    const { source, userScript } = metaData;
    const result: {
      errorMessage: ReturnType<typeof getErrorMessage>;
      errorCategory?: PropertyEvaluationErrorCategory;
      rootcause?: string;
    } = {
      errorMessage: getErrorMessage(error),
      errorCategory: undefined,
      rootcause: undefined,
    };

    for (const errorModifier of modifiers) {
      const { errorCategory, errorMessage, rootcause } = errorModifier(error, {
        tree: this.dataTree,
        asynFns: this.asyncFunctionsNameMap,
        source,
        userScript,
        isViewMode: this.isViewMode,
      });

      result.errorMessage = errorMessage || result.errorMessage;
      result.errorCategory = errorCategory || result.errorCategory;
      result.rootcause = rootcause || result.rootcause;
    }

    return result;
  }

  setAsyncInvocationErrorsRootcause(
    errors: EvaluationError[],
    asyncFunc: string,
  ) {
    return errors.map((error) => {
      if (isActionInvokedInDataField(error)) {
        error.errorMessage.message = FOUND_ACTION_IN_DATA_FIELD_EVAL_MESSAGE;
        error.kind = {
          category:
            PropertyEvaluationErrorCategory.ACTION_INVOCATION_IN_DATA_FIELD,
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
    if (this.isViewMode) return errors;

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

function isActionInvokedInDataField(error: EvaluationError) {
  return (
    error.kind?.category ===
    PropertyEvaluationErrorCategory.ACTION_INVOCATION_IN_DATA_FIELD
  );
}

const UNDEFINED_TYPE_ERROR_REGEX =
  /Cannot read properties of undefined \(reading '([^\s]+)'/;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertAllDataTypesToString(e: any) {
  // Functions do not get converted properly with JSON.stringify
  // So using String fot functions
  // Types like [], {} get converted to "" using String
  // hence using JSON.stringify for the rest
  if (typeof e === "function") {
    return String(e);
  } else {
    try {
      return JSON.stringify(e);
    } catch (error) {
      log.debug(error);
      Sentry.captureException(error);
    }
  }
}

export const ActionInDataFieldErrorModifier: Modifier = (
  error,
  { asynFns, isViewMode },
) => {
  if (isViewMode) return {};

  const errorMessage = getErrorMessage(error);

  if (
    error instanceof FoundPromiseInSyncEvalError ||
    error instanceof ActionCalledInSyncFieldError
  ) {
    return {
      errorMessage,
      errorCategory:
        PropertyEvaluationErrorCategory.ACTION_INVOCATION_IN_DATA_FIELD,
    };
  }

  if (!["ReferenceError", "TypeError"].includes(error.name)) return {};

  for (const asyncFunctionFullPath of Object.keys(asynFns)) {
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
          PropertyEvaluationErrorCategory.ACTION_INVOCATION_IN_DATA_FIELD,
      };
    }
  }

  return {};
};

export const TypeErrorModifier: Modifier = (
  error,
  { isViewMode, source, tree, userScript },
) => {
  if (isViewMode) return {};

  const errorMessage = getErrorMessage(error);

  if (
    error.name === "TypeError" &&
    errorMessage.message.startsWith(
      "Cannot read properties of undefined (reading",
    )
  ) {
    const matchedString = errorMessage.message.match(
      UNDEFINED_TYPE_ERROR_REGEX,
    );

    if (!matchedString) return {};

    const undefinedProperty = matchedString[1];
    const allMemberExpressionObjects = getMemberExpressionObjectFromProperty(
      undefinedProperty,
      userScript,
    );

    if (isEmpty(allMemberExpressionObjects)) return {};

    const possibleCauses = new Set<string>();

    for (const objectString of allMemberExpressionObjects) {
      const paths = toPath(objectString);
      const topLevelEntity = tree[paths[0]];

      if (
        paths.at(1) === "data" &&
        isAction(topLevelEntity) &&
        !get(self, `${paths[0]}.data`, undefined)
      ) {
        errorMessage.message = `Cannot read data from ${paths[0]}. Please re-run your query.`;

        return {
          errorMessage,
          rootcause: `${paths[0]}`,
        };
      }

      if (!get(self, objectString, undefined)) {
        possibleCauses.add(`"${objectString}"`);
      }
    }

    if (isEmpty(possibleCauses)) return {};

    const possibleCausesArr = Array.from(possibleCauses);

    errorMessage.message = `${
      possibleCausesArr.length === 1
        ? `${possibleCausesArr[0]} is undefined`
        : `${Array.from(possibleCauses).join(", ")} could be undefined`
    } . Please fix ${source || "the binding"}.`;

    return {
      errorMessage,
      rootcause: source,
    };
  }

  return {};
};

export const PrimitiveErrorModifier: Modifier = (error) => {
  if (error instanceof Error) {
    const errorMessage = getErrorMessage(error);

    return { errorMessage };
  } else {
    // this covers cases where any primitive value is thrown
    // for eg., throw "error";
    // These types of errors might have a name/message but are not an instance of Error class
    const message = convertAllDataTypesToString(error);
    const errorMessage = {
      name: error?.name || "Error",
      message: error?.message || message,
    };

    return { errorMessage };
  }
};

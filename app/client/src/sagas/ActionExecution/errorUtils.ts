import { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import AppsmithConsole from "utils/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import {
  createMessage,
  DEBUGGER_TRIGGER_ERROR,
  TRIGGER_ACTION_VALIDATION_ERROR,
} from "@appsmith/constants/messages";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { ApiResponse } from "api/ApiResponses";
import { isString } from "lodash";
import { Types } from "utils/TypeHelpers";
import {
  ActionTriggerFunctionNames,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";

/*
 * The base trigger error that also logs the errors in the debugger.
 * Extend this error to make custom handling of errors
 */
export class TriggerFailureError extends Error {
  error?: Error;

  constructor(reason: string, error?: Error) {
    super(reason);
    this.error = error;
  }
}

export class PluginTriggerFailureError extends TriggerFailureError {
  responseData: unknown[] = [];

  constructor(reason: string, responseData: unknown[]) {
    super(reason);
    this.responseData = responseData;
  }
}

export class ActionValidationError extends TriggerFailureError {
  constructor(
    functionName: ActionTriggerType,
    argumentName: string,
    expectedType: Types,
    received: Types,
  ) {
    const errorMessage = createMessage(
      TRIGGER_ACTION_VALIDATION_ERROR,
      ActionTriggerFunctionNames[functionName],
      argumentName,
      expectedType,
      received,
    );
    super(errorMessage);
  }
}

export const logActionExecutionError = (
  errorMessage: string,
  source?: TriggerSource,
  triggerPropertyName?: string,
  errorType?: PropertyEvaluationErrorType,
) => {
  if (triggerPropertyName) {
    AppsmithConsole.addError({
      id: `${source?.id}-${triggerPropertyName}`,
      logType: LOG_TYPE.TRIGGER_EVAL_ERROR,
      text: createMessage(DEBUGGER_TRIGGER_ERROR, triggerPropertyName),
      source: {
        type: ENTITY_TYPE.WIDGET,
        id: source?.id ?? "",
        name: source?.name ?? "",
        propertyPath: triggerPropertyName,
      },
      messages: [
        {
          type: errorType,
          message: errorMessage,
        },
      ],
    });
  }

  Toaster.show({
    text: errorMessage,
    variant: Variant.danger,
    showDebugButton: !!triggerPropertyName,
  });
};

/*
 * Thrown when action execution fails for some reason
 * */
export class PluginActionExecutionError extends Error {
  response?: ApiResponse;
  userCancelled: boolean;

  constructor(message: string, userCancelled: boolean, response?: ApiResponse) {
    super(message);
    this.name = "PluginActionExecutionError";
    this.userCancelled = userCancelled;
    this.response = response;
  }
}

/*
 * The user cancelled the run of this action in a confirmation modal.
 * This modal is shown if an action has a confirmation setting enabled.
 * If they cancel, bail, dont show errors and dont run anything further
 */
export class UserCancelledActionExecutionError extends PluginActionExecutionError {
  constructor() {
    super("User cancelled action execution", true);
    this.name = "UserCancelledActionExecutionError";
  }
}

export class UncaughtPromiseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const getErrorAsString = (error: unknown): string => {
  return isString(error) ? error : JSON.stringify(error);
};

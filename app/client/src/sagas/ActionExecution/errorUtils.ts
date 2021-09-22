import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";
import { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import AppsmithConsole from "utils/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { createMessage, DEBUGGER_TRIGGER_ERROR } from "constants/messages";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { ApiResponse } from "api/ApiResponses";

/*
 * The base trigger error that also logs the errors in the debugger.
 * Extend this error to make custom handling of errors
 */
export class TriggerFailureError extends Error {
  error?: Error;

  constructor(reason: string, triggerMeta: TriggerMeta, error?: Error) {
    super(reason);
    this.error = error;
    const { source, triggerPropertyName } = triggerMeta;
    const errorMessage = error?.message || reason;

    logActionExecutionError(errorMessage, source, triggerPropertyName);
  }
}

export const logActionExecutionError = (
  errorMessage: string,
  source?: TriggerSource,
  triggerPropertyName?: string,
  errorType?: PropertyEvaluationErrorType,
) => {
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

  Toaster.show({
    text: errorMessage,
    variant: Variant.danger,
    showDebugButton: true,
  });
};

export class PluginTriggerFailureError extends TriggerFailureError {
  responseData: unknown[] = [];

  constructor(
    reason: string,
    responseData: unknown[],
    triggerMeta: TriggerMeta,
  ) {
    super(reason, triggerMeta);
    this.responseData = responseData;
  }
}

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

export class TriggerEvaluationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UncaughtAppsmithPromiseError extends TriggerFailureError {
  constructor(message: string, triggerMeta: TriggerMeta, error: Error) {
    super(message, triggerMeta, error);
  }
}

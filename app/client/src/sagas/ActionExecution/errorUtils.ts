import {
  createMessage,
  TRIGGER_ACTION_VALIDATION_ERROR,
} from "ee/constants/messages";
import type { ApiResponse } from "api/ApiResponses";
import { isString } from "lodash";
import type { Types } from "utils/TypeHelpers";
import type { ActionTriggerKeys } from "ee/workers/Evaluation/fns";
import { getActionTriggerFunctionNames } from "ee/workers/Evaluation/fns";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import store from "store";
import showToast from "sagas/ToastSagas";
import { call, put } from "redux-saga/effects";

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
    functionName: ActionTriggerKeys,
    argumentName: string,
    expectedType: Types,
    received: Types,
  ) {
    const errorMessage = createMessage(
      TRIGGER_ACTION_VALIDATION_ERROR,
      getActionTriggerFunctionNames()[functionName],
      argumentName,
      expectedType,
      received,
    );

    super(errorMessage);
  }
}

export function* showToastOnExecutionError(
  errorMessage: string,
  showCTA = true,
) {
  function onDebugClick() {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "TOAST",
    });
    store.dispatch(showDebugger(true));
    store.dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }

  const action = showCTA
    ? {
        text: "debug",
        effect: () => onDebugClick(),
        className: "t--toast-debug-button",
      }
    : undefined;

  // This is the toast that is rendered when any unhandled error occurs in JS object.
  yield call(showToast, errorMessage, {
    kind: "error",
    action,
  });
}

export function* showDebuggerOnExecutionError() {
  yield put(showDebugger(true));
  yield put(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
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

export const getErrorAsString = (error: unknown): string => {
  return isString(error) ? error : JSON.stringify(error);
};

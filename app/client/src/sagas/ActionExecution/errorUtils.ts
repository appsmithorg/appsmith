import type { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import {
  createMessage,
  TRIGGER_ACTION_VALIDATION_ERROR,
} from "@appsmith/constants/messages";
import type { ApiResponse } from "api/ApiResponses";
import { isString } from "lodash";
import type { Types } from "utils/TypeHelpers";
import type { ActionTriggerKeys } from "@appsmith/workers/Evaluation/fns/index";
import { getActionTriggerFunctionNames } from "@appsmith/workers/Evaluation/fns/index";
import { getAppsmithConfigs } from "@appsmith/configs";
import { toast } from "design-system";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import AnalyticsUtil from "../../utils/AnalyticsUtil";
import {
  setDebuggerSelectedTab,
  showDebugger,
} from "../../actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "../../components/editorComponents/Debugger/helpers";
import store from "store";

const APPSMITH_CONFIGS = getAppsmithConfigs();

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
      getActionTriggerFunctionNames(!!APPSMITH_CONFIGS.cloudHosting)[
        functionName
      ],
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
) => {
  //Commenting as per decision taken for the error hanlding epic to not show the trigger errors in the debugger.
  // if (triggerPropertyName) {
  //   AppsmithConsole.addErrors([
  //     {
  //       payload: {
  //         id: `${source?.id}-${triggerPropertyName}`,
  //         logType: LOG_TYPE.TRIGGER_EVAL_ERROR,
  //         text: createMessage(DEBUGGER_TRIGGER_ERROR, triggerPropertyName),
  //         source: {
  //           type: ENTITY_TYPE.WIDGET,
  //           id: source?.id ?? "",
  //           name: source?.name ?? "",
  //           propertyPath: triggerPropertyName,
  //         },
  //         messages: [
  //           {
  //             type: errorType,
  //             message: { name: "TriggerExecutionError", message: errorMessage },
  //           },
  //         ],
  //       },
  //     },
  //   ]);
  // }

  function onDebugClick() {
    const appMode = getAppMode(store.getState());
    if (appMode === "PUBLISHED") return null;

    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "TOAST",
    });
    store.dispatch(showDebugger(true));
    store.dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }

  if (!!triggerPropertyName) {
    toast.show(errorMessage, {
      kind: "error",
    });
  } else {
    toast.show(errorMessage, {
      kind: "error",
      action: {
        text: "debug",
        effect: () => onDebugClick(),
        className: "t--toast-debug-button",
      },
    });
  }
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

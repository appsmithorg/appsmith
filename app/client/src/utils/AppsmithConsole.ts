import {
  addErrorLogInit,
  debuggerLog,
  debuggerLogInit,
  deleteErrorLogsInit,
} from "actions/debuggerActions";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { LogActionPayload, Log } from "entities/AppsmithConsole";
import { Severity, LOG_CATEGORY } from "entities/AppsmithConsole";
import store from "store";
import { isEmpty } from "lodash";

// * @param payload - payload of the error
//  * @param severity - severity of the error
//  * @param category - category of the error
export interface ErrorObject {
  payload: LogActionPayload;
  severity?: Severity;
  category?: LOG_CATEGORY;
}

function dispatchAction(action: ReduxAction<unknown>) {
  store.dispatch(action);
}

function log(ev: Log) {
  dispatchAction(debuggerLogInit([ev]));
}

function getTimeStamp() {
  return Date.now().toString();
}

function addLogs(logs: Log[]) {
  dispatchAction(debuggerLog(logs));
}

function info(
  ev: LogActionPayload,
  timestamp = getTimeStamp(),
  category = LOG_CATEGORY.PLATFORM_GENERATED,
) {
  log({
    ...ev,
    severity: Severity.INFO,
    timestamp,
    category,
    occurrenceCount: 1,
    isExpanded: false,
  });
}

function warning(
  ev: LogActionPayload,
  timestamp = getTimeStamp(),
  category = LOG_CATEGORY.PLATFORM_GENERATED,
) {
  log({
    ...ev,
    severity: Severity.WARNING,
    timestamp,
    category,
    occurrenceCount: 1,
    isExpanded: false,
  });
}

// This is used to show a log as an error
// NOTE: These logs won't appear in the errors tab
// To add errors to the errors tab use the addError method.
function error(
  ev: LogActionPayload,
  timestamp = getTimeStamp(),
  category = LOG_CATEGORY.PLATFORM_GENERATED,
) {
  log({
    ...ev,
    severity: Severity.ERROR,
    timestamp,
    category,
    occurrenceCount: 1,
    isExpanded: false,
  });
}

// Function used to add errors to the error tab of the debugger
function addErrors(errors: ErrorObject[]) {
  if (isEmpty(errors)) return;
  const refinedErrors = errors.map((error) => ({
    ...error.payload,
    severity: error.severity ?? Severity.ERROR,
    timestamp: getTimeStamp(),
    occurrenceCount: 1,
    category: error.category ?? LOG_CATEGORY.PLATFORM_GENERATED,
    isExpanded: false,
  }));

  dispatchAction(addErrorLogInit(refinedErrors));
}

// This is used to remove errors from the error tab of the debugger
function deleteErrors(errors: { id: string; analytics?: Log["analytics"] }[]) {
  if (isEmpty(errors)) return;
  dispatchAction(deleteErrorLogsInit(errors));
}

export default {
  addLogs,
  info,
  warning,
  error,
  addErrors,
  deleteErrors,
};

import {
  addErrorLogInit,
  debuggerLog,
  debuggerLogInit,
  deleteErrorLogsInit,
} from "actions/debuggerActions";
import { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  Severity,
  LogActionPayload,
  Log,
  LOG_CATEGORY,
} from "entities/AppsmithConsole";
import moment from "moment";
import store from "store";
import AnalyticsUtil from "./AnalyticsUtil";
import { isEmpty } from "lodash";

function dispatchAction(action: ReduxAction<unknown>) {
  store.dispatch(action);
}

function log(ev: Log) {
  if (ev.category === LOG_CATEGORY.USER_GENERATED) {
    AnalyticsUtil.logEvent("CONSOLE_LOG_CREATED", {
      entityName: ev.source?.name,
      entityType: ev.source?.type,
    });
  }
  dispatchAction(debuggerLogInit([ev]));
}

function getTimeStamp() {
  return moment().format("hh:mm:ss");
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
  });
}

// Function used to add errors to the error tab of the debugger
function addErrors(
  errors: {
    payload: LogActionPayload;
    severity?: Severity;
    category?: LOG_CATEGORY;
  }[],
) {
  if (isEmpty(errors)) return;
  const refinedErrors = errors.map((error) => ({
    ...error.payload,
    severity: error.severity ?? Severity.ERROR,
    timestamp: getTimeStamp(),
    occurrenceCount: 1,
    category: error.category ?? LOG_CATEGORY.PLATFORM_GENERATED,
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

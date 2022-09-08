import {
  addErrorLogInit,
  debuggerLogInit,
  deleteErrorLogInit,
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
  dispatchAction(debuggerLogInit(ev));
}

function getTimeStamp() {
  return moment().format("hh:mm:ss");
}

function addLog(
  ev: LogActionPayload,
  severity = Severity.INFO,
  timestamp = getTimeStamp(),
  category = LOG_CATEGORY.USER_GENERATED,
) {
  log({
    ...ev,
    severity,
    timestamp,
    category,
  });
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
  });
}

// This is used to add an error to the errors tab
function addError(
  payload: LogActionPayload,
  severity = Severity.ERROR,
  category = LOG_CATEGORY.PLATFORM_GENERATED,
) {
  dispatchAction(
    addErrorLogInit({
      ...payload,
      severity: severity,
      timestamp: getTimeStamp(),
      category,
    }),
  );
}

// This is used to remove an error from the errors tab
function deleteError(id: string, analytics?: Log["analytics"]) {
  dispatchAction(deleteErrorLogInit(id, analytics));
}

export default {
  addLog,
  info,
  warning,
  error,
  addError,
  deleteError,
};

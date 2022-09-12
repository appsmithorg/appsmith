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
import { klona } from "klona/lite";
import equal from "fast-deep-equal";

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
    occurrenceCount: 1,
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
      occurrenceCount: 1,
    }),
  );
}

// This is used to remove an error from the errors tab
function deleteError(id: string, analytics?: Log["analytics"]) {
  dispatchAction(deleteErrorLogInit(id, analytics));
}

// check the last message from the current log and update the occurrence count
export function removeRepeatedLogsAndMerge(
  currentLogs: Log[],
  incomingLogs: Log[],
) {
  // first remove the repeated logs from incoming logs
  const outputArray = klona(currentLogs);
  incomingLogs.forEach((incomingLog) => {
    if (outputArray.length === 0) {
      outputArray.push(incomingLog);
    } else {
      const lastLog = outputArray[outputArray.length - 1];
      if (!compareLogs(lastLog, incomingLog)) {
        outputArray.push(incomingLog);
      } else {
        lastLog.hasOwnProperty("occurrenceCount") && !!lastLog.occurrenceCount
          ? lastLog.occurrenceCount++
          : (lastLog.occurrenceCount = 2);
      }
    }
  });
  return outputArray;
}

// comparing logs to check if they are same, added early escape conditions
// to improve performance
function compareLogs(log1: Log, log2: Log) {
  try {
    if (log1.category !== log2.category) return false;
    if (log1.logType !== log2.logType) return false;
    if (log1.timestamp !== log2.timestamp) return false;
    if (log1.severity !== log2.severity) return false;
    if (!equal(log1.source, log2.source)) return false;
    if (log1.text !== log2.text) return false;
    if (!equal(log1.logData, log2.logData)) return false;
    if (!equal(log1.state, log2.state)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export default {
  addLog,
  info,
  warning,
  error,
  addError,
  deleteError,
};

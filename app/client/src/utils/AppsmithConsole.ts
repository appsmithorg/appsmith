import {
  addErrorLogInit,
  debuggerLogInit,
  deleteErrorLogInit,
} from "actions/debuggerActions";
import { ReduxAction } from "constants/ReduxActionConstants";
import { Severity, LogActionPayload, Log } from "entities/AppsmithConsole";
import moment from "moment";
import store from "store";

function dispatchAction(action: ReduxAction<unknown>) {
  store.dispatch(action);
}

function log(ev: Log) {
  dispatchAction(debuggerLogInit(ev));
}

function getTimeStamp() {
  return moment().format("hh:mm:ss");
}

function info(ev: LogActionPayload) {
  log({
    ...ev,
    severity: Severity.INFO,
    timestamp: getTimeStamp(),
  });
}

function warning(ev: LogActionPayload) {
  log({
    ...ev,
    severity: Severity.WARNING,
    timestamp: getTimeStamp(),
  });
}

function error(ev: LogActionPayload) {
  log({
    ...ev,
    severity: Severity.ERROR,
    timestamp: getTimeStamp(),
  });
}

function addError(payload: LogActionPayload) {
  dispatchAction(
    addErrorLogInit({
      ...payload,
      severity: Severity.ERROR,
      timestamp: getTimeStamp(),
    }),
  );
}

function deleteError(id: string, analytics?: Log["analytics"]) {
  dispatchAction(deleteErrorLogInit(id, analytics));
}

export default {
  info,
  warning,
  error,
  addError,
  deleteError,
};

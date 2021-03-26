import { debuggerLogInit } from "actions/debuggerActions";
import { Message, Severity, LogActionPayload } from "entities/AppsmithConsole";
import moment from "moment";
import store from "store";

// Eventually, if/when we need to dispatch events, we can import store and use store.dispatch
function log(ev: Message) {
  store.dispatch(debuggerLogInit(ev));
}

/**
 * Helper functions, always supposed to be 1:1 mapped with `entities/AppsmithConsole/index.ts`
 */

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

export default {
  info,
  warning,
  error,
};

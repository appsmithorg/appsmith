import { Message, ActionableError, Severity } from "entities/AppsmithConsole";

// Eventually, if/when we need to dispatch events, we can import store and use store.dispatch
export function log(ev: Message) {
  ev.timestamp = ev.timestamp || new Date();
  switch (ev.severity) {
    case Severity.DEBUG:
      console.debug(ev);
      break;
    case Severity.INFO:
      console.info(ev);
      break;
    case Severity.WARNING:
      console.warn(ev);
      break;
    case (Severity.ERROR, Severity.CRITICAL):
      console.error(ev);
      break;
    default:
      console.error("received event with unknown event severity", ev);
  }
}

/**
 * Helper functions, always supposed to be 1:1 mapped with `entities/AppsmithConsole/index.ts`
 */

export function debug(ev: Message) {
  ev.severity = Severity.DEBUG;
  log(ev);
}

export function info(ev: Message) {
  ev.severity = Severity.INFO;
  log(ev);
}

export function warning(ev: Message) {
  ev.severity = Severity.WARNING;
  log(ev);
}

export function error(ev: ActionableError) {
  ev.severity = Severity.ERROR;
  log(ev);
}

export function critical(ev: ActionableError) {
  ev.severity = Severity.CRITICAL;
  log(ev);
}

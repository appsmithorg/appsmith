import _ from "lodash";

import { ActionableError, TimelineEvent } from "entities/Errors";

export const MetaLoggerMiddleware = () => (next: any) => (action: any) => {
  if (!action.meta) {
    action.meta = {};
  }

  if (action.meta.logger) {
    action.meta.logger = action.meta.logger.clone();
  } else {
    action.meta.logger = new MetaLogger();
  }

  return next(action);
};

let errId = 0;
export function nextErrorId() {
  errId++;
  return errId;
}

export class MetaLogger {
  private _trace: TimelineEvent | undefined;

  constructor(initial?: TimelineEvent) {
    this._trace = initial;
  }

  logEvent(msg: TimelineEvent, skipClone = false) {
    if (!skipClone) {
      msg = _.cloneDeep(msg);
    }
    msg.previous = this._trace;
    this._trace = msg;
    console.log(msg);
  }

  logError(err: ActionableError, skipClone = false) {
    if (!skipClone) {
      err = _.cloneDeep(err);
    }
    err.previous = this._trace;
    console.error(err);
  }

  getAll() {
    return _.cloneDeep(this._trace);
  }

  clone() {
    return new MetaLogger(this.getAll());
  }
}

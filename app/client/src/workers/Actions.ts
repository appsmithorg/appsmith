import { ActionDescription } from "entities/DataTree/dataTreeFactory";

class AppsmithPromise {
  action?: ActionDescription<any>;
  constructor(action: ActionDescription<any>) {
    this.action = action;
  }
  parsed = () => {
    return this.action;
  };
  all = (promises: AppsmithPromise[]) => {
    return {
      type: "PROMISE_ALL",
      payload: promises.map((promise) => promise.parsed()),
    };
  };
}

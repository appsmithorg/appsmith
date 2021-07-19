/*
 * An AppsmithPromise is a mock promise class to replicate promise functionalities
 * in the Appsmith world.
 *
 * To mimic the async nature of promises, we will return back
 * action descriptors that get resolved in the main thread and then go back to action
 * execution flow as the workflow is designed.
 *
 * Whenever an async call needs to run, it is wrapped around this promise descriptor
 * and sent to the main thread to execute.
 *
 * new Promise(() => {
 *  return Api1.run()
 * })
 * .then(() => {
 *  return Api2.run()
 * })
 * .catch(() => {
 *  return showMessage('An Error Occurred', 'error')
 * })
 *
 * {
 *  type: "APPSMITH_PROMISE",
 *  payload: [{
 *    type: "EXECUTE_ACTION",
 *    payload: { actionId: "..." }
 *   }],
 *   then: "() => { return Api2.run() }",
 *   catch: "() => { return showMessage('An Error Occurred', 'error) }"
 * }
 *
 *
 *
 * */

import { ActionDescription } from "entities/DataTree/dataTreeFactory";

enum states {
  pending = "Pending",
  resolved = "Resolved",
  rejected = "Rejected",
}

type Executor = (resolve: Resolve, reject: Reject) => unknown;
type Resolve = (value: unknown) => void;
type Reject = (value: unknown) => void;

class AppsmithPromise {
  constructor(executor: Executor) {
    const tryCall = (callback) =>
      AppsmithPromise.try(() => callback(this.value));
    const laterCalls = [];
    const callLater = (getMember) => (callback) =>
      new AppsmithPromise((resolve) =>
        laterCalls.push(() => resolve(getMember()(callback))),
      );
    const members = {
      [states.resolved]: {
        state: states.resolved,
        then: tryCall,
        catch: (_) => this,
      },
      [states.rejected]: {
        state: states.rejected,
        then: (_) => this,
        catch: tryCall,
      },
      [states.pending]: {
        state: states.pending,
        then: callLater(() => this.then),
        catch: callLater(() => this.catch),
      },
    };
    const changeState = (state) => Object.assign(this, members[state]);
    const apply = (value, state) => {
      if (this.state === states.pending) {
        this.value = value;
        changeState(state);
        for (const laterCall of laterCalls) {
          laterCall();
        }
      }
    };

    const getCallback = (state) => (value) => {
      if (value instanceof AppsmithPromise && state === states.resolved) {
        value.then((value) => apply(value, states.resolved));
        value.catch((value) => apply(value, states.rejected));
      } else {
        apply(value, state);
      }
    };

    const resolve = getCallback(states.resolved);
    const reject = getCallback(states.rejected);
    changeState(states.pending);
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  static resolve(value) {
    return new AppsmithPromise((resolve) => resolve(value));
  }

  static reject(value) {
    return new AppsmithPromise((_, reject) => reject(value));
  }

  static try(callback) {
    return new AppsmithPromise((resolve) => resolve(callback()));
  }
}

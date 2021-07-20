/* eslint-disable @typescript-eslint/ban-types */
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
 *  payload: {
 *   executor: [{
 *    type: "EXECUTE_ACTION",
 *    payload: { actionId: "..." }
 *   }]
 *   then: ["() => { return Api2.run() }"],
 *   catch: "() => { return showMessage('An Error Occurred', 'error) }"
 *  }
 * }
 *
 *
 *
 * */

import {
  ActionDescription,
  DataTree,
  DataTreeAction,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { isAction } from "./evaluationUtils";

export type AppsmithPromisePayload = {
  executor: ActionDescription<any>[];
  then: string[];
  catch?: string;
  finally?: string;
};

export class AppsmithPromise {
  action: ActionDescription<AppsmithPromisePayload> = {
    type: "PROMISE",
    payload: {
      executor: [],
      then: [],
    },
  };

  constructor(
    executor: ActionDescription<any>[] | (() => ActionDescription<any>[]),
  ) {
    if (typeof executor === "function") {
      this.action.payload.executor = [new AppsmithPromise(executor()).action];
    } else {
      this.action.payload.executor = executor;
    }

    return this;
  }

  then(executor?: Function) {
    if (executor) {
      this.action.payload.then.push(`{{${executor.toString()}}}`);
    }
    return this;
  }

  catch(executor: Function) {
    if (executor) {
      this.action.payload.catch = `{{${executor.toString()}}}`;
    }
    return this;
  }

  finally(executor: Function) {
    if (executor) {
      this.action.payload.finally = `{{${executor.toString()}}}`;
    }
    return this;
  }
}

export const addFunctions = (dataTree: Readonly<DataTree>): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);

  withFunction.actionPaths = [];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withFunction.Promise = AppsmithPromise;

  Object.keys(withFunction).forEach((entityName) => {
    const entity = withFunction[entityName];
    if (isAction(entity)) {
      const runFunction = function(
        this: DataTreeAction,
        onSuccess: Function,
        onError: Function,
        params = "",
      ) {
        return new AppsmithPromise([
          {
            type: "RUN_ACTION",
            payload: {
              actionId: this.actionId,
              params,
            },
          },
        ])
          .then(onSuccess)
          .catch(onError);
      };
      _.set(withFunction, `${entityName}.run`, runFunction);
      withFunction.actionPaths &&
        withFunction.actionPaths.push(`${entityName}.run`);
    }
  });
  withFunction.navigateTo = function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: string,
  ) {
    return new AppsmithPromise([
      {
        type: "NAVIGATE_TO",
        payload: { pageNameOrUrl, params, target },
      },
    ]);
  };
  withFunction.actionPaths.push("navigateTo");

  withFunction.showAlert = function(message: string, style: string) {
    return new AppsmithPromise([
      {
        type: "SHOW_ALERT",
        payload: { message, style },
      },
    ]);
  };
  withFunction.actionPaths.push("showAlert");

  withFunction.showModal = function(modalName: string) {
    return new AppsmithPromise([
      {
        type: "SHOW_MODAL_BY_NAME",
        payload: { modalName },
      },
    ]);
  };
  withFunction.actionPaths.push("showModal");

  withFunction.closeModal = function(modalName: string) {
    return new AppsmithPromise([
      {
        type: "CLOSE_MODAL",
        payload: { modalName },
      },
    ]);
  };
  withFunction.actionPaths.push("closeModal");

  withFunction.storeValue = function(
    key: string,
    value: string,
    persist = true,
  ) {
    return new AppsmithPromise([
      {
        type: "STORE_VALUE",
        payload: { key, value, persist },
      },
    ]);
  };
  withFunction.actionPaths.push("storeValue");

  withFunction.download = function(data: string, name: string, type: string) {
    return new AppsmithPromise([
      {
        type: "DOWNLOAD",
        payload: { data, name, type },
      },
    ]);
  };
  withFunction.actionPaths.push("download");

  withFunction.copyToClipboard = function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return new AppsmithPromise([
      {
        type: "COPY_TO_CLIPBOARD",
        payload: {
          data,
          options: { debug: options?.debug, format: options?.format },
        },
      },
    ]);
  };
  withFunction.actionPaths.push("copyToClipboard");

  withFunction.resetWidget = function(
    widgetName: string,
    resetChildren = false,
  ) {
    return new AppsmithPromise([
      {
        type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
        payload: { widgetName, resetChildren },
      },
    ]);
  };
  withFunction.actionPaths.push("resetWidget");

  return withFunction;
};

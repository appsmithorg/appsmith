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
  ActionDispatcher,
  DataTree,
  DataTreeAction,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { getEntityNameAndPropertyPath, isAction } from "./evaluationUtils";

export type AppsmithPromisePayload = {
  executor: ActionDescription<any>[];
  then: string[];
  catch?: string;
  finally?: string;
};

let promiseTriggers: ActionDescription<any>[] = [];

export const pusher = function(
  this: { triggers: ActionDescription<any>[] },
  action: any,
  ...payload: any[]
) {
  const actionPayload = action(...payload);
  if (actionPayload instanceof AppsmithPromise) {
    this.triggers.push(actionPayload.action);
    return actionPayload;
  }
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      self.actionPaths.forEach(AppsmithPromise._pusherOverride);
      executor();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      self.actionPaths.forEach((actionPath) =>
        AppsmithPromise._pusherOverride(actionPath, true),
      );
      this.action.payload.executor = promiseTriggers;
      promiseTriggers = [];
    } else {
      this.action.payload.executor = executor;
    }
    return this;
  }

  static _pusherOverride(actionPath: string, revert = false) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      actionPath,
    );
    const promiseThis = { triggers: promiseTriggers };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const globalThis = { triggers: self.triggers };
    if (entityName === actionPath) {
      const action = _.get(DATA_TREE_FUNCTIONS, actionPath);
      if (action) {
        _.set(
          self,
          actionPath,
          pusher.bind(revert ? globalThis : promiseThis, action),
        );
      }
    } else {
      const entity = _.get(self, entityName);
      const funcCreator = DATA_TREE_FUNCTIONS[propertyPath];
      if (typeof funcCreator === "object" && "qualifier" in funcCreator) {
        const func = funcCreator.func(entity);
        _.set(
          self,
          actionPath,
          pusher.bind(revert ? globalThis : promiseThis, func),
        );
      }
    }
  }

  then(executor?: Function) {
    if (executor) {
      this.action.payload.then.push(
        `{{ new Promise(${executor.toString()}) }}`,
      );
    }
    return this;
  }

  catch(executor: Function) {
    if (executor) {
      this.action.payload.catch = `{{ new Promise(${executor.toString()}) }}`;
    }
    return this;
  }

  finally(executor: Function) {
    if (executor) {
      this.action.payload.finally = `{{ new Promise(${executor.toString()}) }}`;
    }
    return this;
  }
}

const DATA_TREE_FUNCTIONS: Record<
  string,
  ActionDispatcher<any, any> | { qualifier: Function; func: Function }
> = {
  navigateTo: function(
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
  },
  showAlert: function(message: string, style: string) {
    return new AppsmithPromise([
      {
        type: "SHOW_ALERT",
        payload: { message, style },
      },
    ]);
  },
  showModal: function(modalName: string) {
    return new AppsmithPromise([
      {
        type: "SHOW_MODAL_BY_NAME",
        payload: { modalName },
      },
    ]);
  },
  closeModal: function(modalName: string) {
    return new AppsmithPromise([
      {
        type: "CLOSE_MODAL",
        payload: { modalName },
      },
    ]);
  },
  storeValue: function(key: string, value: string, persist = true) {
    return new AppsmithPromise([
      {
        type: "STORE_VALUE",
        payload: { key, value, persist },
      },
    ]);
  },
  download: function(data: string, name: string, type: string) {
    return new AppsmithPromise([
      {
        type: "DOWNLOAD",
        payload: { data, name, type },
      },
    ]);
  },
  copyToClipboard: function(
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
  },
  resetWidget: function(widgetName: string, resetChildren = false) {
    return new AppsmithPromise([
      {
        type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
        payload: { widgetName, resetChildren },
      },
    ]);
  },
  run: {
    qualifier: isAction,
    func: (entity: DataTreeAction) =>
      function(onSuccess: Function, onError: Function, params = "") {
        return new AppsmithPromise([
          {
            type: "RUN_ACTION",
            payload: {
              actionId: entity.actionId,
              params,
            },
          },
        ])
          .then(onSuccess)
          .catch(onError);
      },
  },
};

export const addFunctions = (dataTree: Readonly<DataTree>): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);

  withFunction.actionPaths = [];

  Object.entries(DATA_TREE_FUNCTIONS).forEach(([name, funcOrFuncCreator]) => {
    if (
      typeof funcOrFuncCreator === "object" &&
      "qualifier" in funcOrFuncCreator
    ) {
      Object.entries(dataTree).forEach(([entityName, entity]) => {
        if (funcOrFuncCreator.qualifier(entity)) {
          const func = funcOrFuncCreator.func(entity);
          const funcName = `${entityName}.${name}`;
          _.set(withFunction, funcName, func);
          withFunction.actionPaths?.push(funcName);
        }
      });
    } else {
      withFunction[name] = funcOrFuncCreator;
      withFunction.actionPaths?.push(name);
    }
  });

  return withFunction;
};

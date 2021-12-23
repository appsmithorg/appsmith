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
  ActionDispatcher,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isAppsmithEntity,
  isTrueObject,
} from "./evaluationUtils";
import {
  ActionDescription,
  ActionTriggerType,
  PromiseActionDescription,
} from "entities/DataTree/actionTriggers";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";

export type AppsmithPromisePayload = {
  executor: ActionDescription[];
  then: string[];
  catch?: string;
  finally?: string;
};

export const pusher: ActionDispatcher = function(
  this: { triggers: ActionDescription[]; isPromise: boolean },
  action: any,
  ...payload: any[]
) {
  const actionPayload = action(...payload);
  if (actionPayload instanceof AppsmithPromise) {
    this.triggers.push(actionPayload.action);
    return actionPayload;
  }
  return action;
};

export const pusherOverride = (revert = false) => {
  self.actionPaths.forEach((actionPath) => {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      actionPath,
    );
    const promiseThis = { triggers: promiseTriggers, isPromise: true };
    const globalThis = { triggers: self.triggers, isPromise: false };
    const overrideThis = revert ? globalThis : promiseThis;
    if (entityName === actionPath) {
      const action = _.get(DATA_TREE_FUNCTIONS, actionPath);
      if (action) {
        _.set(self, actionPath, pusher.bind(overrideThis, action));
      }
    } else {
      const entity = _.get(self, entityName);
      const funcCreator = DATA_TREE_FUNCTIONS[propertyPath];
      if (typeof funcCreator === "object" && "qualifier" in funcCreator) {
        const func = funcCreator.func(entity);
        _.set(self, actionPath, pusher.bind(overrideThis, func));
      }
    }
  });
};

let promiseTriggers: ActionDescription[] = [];

export class AppsmithPromise {
  action: PromiseActionDescription = {
    type: ActionTriggerType.PROMISE,
    payload: {
      executor: [],
      then: [],
    },
  };
  triggerReference?: number;

  constructor(executor: ActionDescription[] | (() => ActionDescription[])) {
    if (typeof executor === "function") {
      pusherOverride();
      executor();
      this.action.payload.executor = [...promiseTriggers];
      promiseTriggers = [];
      pusherOverride(true);
    } else {
      this.action.payload.executor = executor;
    }
    this._attachToSelfTriggers();
    return this;
  }

  private removeDuplicates() {
    self.triggers = self.triggers.filter((trigger) => {
      return !this.action.payload.executor.includes(trigger);
    });
  }

  private _attachToSelfTriggers() {
    if (self.triggers) {
      this.removeDuplicates();
      if (_.isNumber(this.triggerReference)) {
        self.triggers[this.triggerReference] = this.action;
      } else {
        self.triggers.push(this.action);
        this.triggerReference = self.triggers.length - 1;
      }
    }
  }

  then(executor?: Function) {
    if (executor) {
      this.action.payload.then.push(`{{ ${executor.toString()} }}`);
      this._attachToSelfTriggers();
    }
    return this;
  }

  catch(executor: Function) {
    if (executor) {
      this.action.payload.catch = `{{ ${executor.toString()} }}`;
      this._attachToSelfTriggers();
    }
    return this;
  }

  finally(executor: Function) {
    if (executor) {
      this.action.payload.finally = `{{ ${executor.toString()} }}`;
      this._attachToSelfTriggers();
    }
    return this;
  }

  static all(actions: ActionDescription[]) {
    return new AppsmithPromise(actions);
  }
}

const DATA_TREE_FUNCTIONS: Record<
  string,
  | ActionDispatcher
  | {
      qualifier: (entity: DataTreeEntity) => boolean;
      func: (entity: DataTreeEntity) => ActionDispatcher;
      path?: string;
    }
> = {
  navigateTo: function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: NavigationTargetType,
  ) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.NAVIGATE_TO,
        payload: { pageNameOrUrl, params, target },
      },
    ]);
  },
  showAlert: function(
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.SHOW_ALERT,
        payload: { message, style },
      },
    ]);
  },
  showModal: function(modalName: string) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.SHOW_MODAL_BY_NAME,
        payload: { modalName },
      },
    ]);
  },
  closeModal: function(modalName: string) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.CLOSE_MODAL,
        payload: { modalName },
      },
    ]);
  },
  storeValue: function(key: string, value: string, persist = true) {
    // momentarily store this value in local state to support loops
    _.set(self, `appsmith.store[${key}]`, value);
    return new AppsmithPromise([
      {
        type: ActionTriggerType.STORE_VALUE,
        payload: { key, value, persist },
      },
    ]);
  },
  download: function(data: string, name: string, type: string) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.DOWNLOAD,
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
        type: ActionTriggerType.COPY_TO_CLIPBOARD,
        payload: {
          data,
          options: { debug: options?.debug, format: options?.format },
        },
      },
    ]);
  },
  resetWidget: function(widgetName: string, resetChildren = true) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME,
        payload: { widgetName, resetChildren },
      },
    ]);
  },
  run: {
    qualifier: (entity) => isAction(entity),
    func: (entity) =>
      function(
        onSuccessOrParams?: Function | Record<string, unknown>,
        onError?: Function,
        params = {},
      ) {
        const isOldSignature = typeof onSuccessOrParams === "function";
        const isNewSignature = isTrueObject(onSuccessOrParams);
        const runActionPromise = new AppsmithPromise([
          {
            type: ActionTriggerType.RUN_PLUGIN_ACTION,
            payload: {
              actionId: isAction(entity) ? entity.actionId : "",
              params: isNewSignature ? onSuccessOrParams : params,
            },
          },
        ]);
        if (isOldSignature && typeof onSuccessOrParams === "function") {
          if (onSuccessOrParams) runActionPromise.then(onSuccessOrParams);
          if (onError) runActionPromise.catch(onError);
        }
        return runActionPromise;
      },
  },
  clear: {
    qualifier: (entity) => isAction(entity),
    func: (entity) => () => {
      return new AppsmithPromise([
        {
          type: ActionTriggerType.CLEAR_PLUGIN_ACTION,
          payload: {
            actionId: isAction(entity) ? entity.actionId : "",
          },
        },
      ]);
    },
  },
  setInterval: function(callback: Function, interval: number, id?: string) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.SET_INTERVAL,
        payload: {
          callback: callback.toString(),
          interval,
          id,
        },
      },
    ]);
  },
  clearInterval: function(id: string) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.CLEAR_INTERVAL,
        payload: {
          id,
        },
      },
    ]);
  },
  getGeoLocation: {
    qualifier: (entity) => isAppsmithEntity(entity),
    path: "appsmith.geolocation.getCurrentPosition",
    func: () =>
      function(
        successCallback?: Function,
        errorCallback?: Function,
        options?: {
          maximumAge?: number;
          timeout?: number;
          enableHighAccuracy?: boolean;
        },
      ) {
        const mainRequest = new AppsmithPromise([
          {
            type: ActionTriggerType.GET_CURRENT_LOCATION,
            payload: {
              options,
            },
          },
        ]);
        if (errorCallback) {
          mainRequest.catch(errorCallback);
        }
        if (successCallback) {
          mainRequest.then(successCallback);
        }
        return mainRequest;
      },
  },
  watchGeoLocation: {
    qualifier: (entity) => isAppsmithEntity(entity),
    path: "appsmith.geolocation.watchPosition",
    func: () =>
      function(
        onSuccessCallback?: Function,
        onErrorCallback?: Function,
        options?: {
          maximumAge?: number;
          timeout?: number;
          enableHighAccuracy?: boolean;
        },
      ) {
        return new AppsmithPromise([
          {
            type: ActionTriggerType.WATCH_CURRENT_LOCATION,
            payload: {
              options,
              onSuccess: onSuccessCallback
                ? `{{${onSuccessCallback.toString()}}}`
                : undefined,
              onError: onErrorCallback
                ? `{{${onErrorCallback.toString()}}}`
                : undefined,
            },
          },
        ]);
      },
  },
  stopWatchGeoLocation: {
    qualifier: (entity) => isAppsmithEntity(entity),
    path: "appsmith.geolocation.clearWatch",
    func: () =>
      function() {
        return new AppsmithPromise([
          {
            type: ActionTriggerType.STOP_WATCHING_CURRENT_LOCATION,
          },
        ]);
      },
  },
};

declare global {
  interface Window {
    triggers: ActionDescription[];
    actionPaths: string[];
  }
}

export const enhanceDataTreeWithFunctions = (
  dataTree: Readonly<DataTree>,
): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);
  self.triggers = [];
  self.actionPaths = [];

  Object.entries(DATA_TREE_FUNCTIONS).forEach(([name, funcOrFuncCreator]) => {
    if (
      typeof funcOrFuncCreator === "object" &&
      "qualifier" in funcOrFuncCreator
    ) {
      Object.entries(dataTree).forEach(([entityName, entity]) => {
        if (funcOrFuncCreator.qualifier(entity)) {
          const func = funcOrFuncCreator.func(entity);
          const funcName = funcOrFuncCreator.path || `${entityName}.${name}`;
          _.set(
            withFunction,
            funcName,
            pusher.bind({ triggers: self.triggers, isPromise: false }, func),
          );
          self.actionPaths.push(funcName);
        }
      });
    } else {
      withFunction[name] = pusher.bind(
        { triggers: self.triggers, isPromise: false },
        funcOrFuncCreator,
      );
      self.actionPaths.push(name);
    }
  });

  return withFunction;
};

/* eslint-disable @typescript-eslint/ban-types */
import {
  ActionDispatcher,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { isAction, isTrueObject } from "./evaluationUtils";
import { ActionTriggerType } from "entities/DataTree/actionTriggers";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { promisifyAction } from "workers/PromisifyAction";

declare global {
  interface Window {
    REQUEST_ID?: string;
    ALLOW_ASYNC?: boolean;
    IS_ASYNC?: boolean;
    COLLECTOR: Promise<any>[];
    GLOBAL_FUNCTIONS: Record<string, ActionDispatcher>;
  }
}

const DATA_TREE_FUNCTIONS: Record<
  string,
  | ActionDispatcher
  | {
      qualifier: (entity: DataTreeEntity) => boolean;
      func: (entity: DataTreeEntity) => ActionDispatcher;
    }
> = {
  navigateTo: function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: NavigationTargetType,
  ) {
    return promisifyAction({
      type: ActionTriggerType.NAVIGATE_TO,
      payload: { pageNameOrUrl, params, target },
    });
  },
  showAlert: function(
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return promisifyAction({
      type: ActionTriggerType.SHOW_ALERT,
      payload: { message, style },
    });
  },
  showModal: function(modalName: string) {
    return promisifyAction({
      type: ActionTriggerType.SHOW_MODAL_BY_NAME,
      payload: { modalName },
    });
  },
  closeModal: function(modalName: string) {
    return promisifyAction({
      type: ActionTriggerType.CLOSE_MODAL,
      payload: { modalName },
    });
  },
  storeValue: function(key: string, value: string, persist = true) {
    // momentarily store this value in local state to support loops
    _.set(self, `appsmith.store[${key}]`, value);
    return promisifyAction({
      type: ActionTriggerType.STORE_VALUE,
      payload: { key, value, persist },
    });
  },
  download: function(data: string, name: string, type: string) {
    return promisifyAction({
      type: ActionTriggerType.DOWNLOAD,
      payload: { data, name, type },
    });
  },
  copyToClipboard: function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return promisifyAction({
      type: ActionTriggerType.COPY_TO_CLIPBOARD,
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
    });
  },
  resetWidget: function(widgetName: string, resetChildren = true) {
    return promisifyAction({
      type: ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME,
      payload: { widgetName, resetChildren },
    });
  },
  run: {
    qualifier: (entity) => isAction(entity),
    func: (entity) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      function(
        onSuccessOrParams?: () => unknown | Record<string, unknown>,
        onError?: () => unknown,
        params = {},
      ) {
        const isOldSignature = typeof onSuccessOrParams === "function";
        const isNewSignature = isTrueObject(onSuccessOrParams);
        const runActionPromise = promisifyAction({
          type: ActionTriggerType.RUN_PLUGIN_ACTION,
          payload: {
            actionId: isAction(entity) ? entity.actionId : "",
            params: isNewSignature ? onSuccessOrParams : params,
          },
        });
        if (isOldSignature && typeof onSuccessOrParams === "function") {
          // catch is attached first so that we can catch only the main run errors
          if (onError)
            runActionPromise.catch((res) => {
              return oldActionBind(res, onError);
            });
          if (onSuccessOrParams) {
            runActionPromise.then((res) => {
              return oldActionBind(res, onSuccessOrParams);
            });
          }
          // if (onError) runActionPromise.catch(onError);
          // if (onSuccessOrParams) runActionPromise.then(onSuccessOrParams);
        }
        return runActionPromise;
      },
  },
  clear: {
    qualifier: (entity) => isAction(entity),
    func: (entity) => () => {
      return promisifyAction({
        type: ActionTriggerType.CLEAR_PLUGIN_ACTION,
        payload: {
          actionId: isAction(entity) ? entity.actionId : "",
        },
      });
    },
  },
  setInterval: function(callback: Function, interval: number, id?: string) {
    return promisifyAction({
      type: ActionTriggerType.SET_INTERVAL,
      payload: {
        callback: callback.toString(),
        interval,
        id,
      },
    });
  },
  clearInterval: function(id: string) {
    return promisifyAction({
      type: ActionTriggerType.CLEAR_INTERVAL,
      payload: {
        id,
      },
    });
  },
};

export const enhanceDataTreeWithFunctions = (
  dataTree: Readonly<DataTree>,
): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);
  self.GLOBAL_FUNCTIONS = {};

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
          self.GLOBAL_FUNCTIONS[funcName] = func;
        }
      });
    } else {
      withFunction[name] = funcOrFuncCreator;
      self.GLOBAL_FUNCTIONS[name] = funcOrFuncCreator;
    }
  });

  return withFunction;
};

export const pusher = function(
  this: { collector: Promise<any>[] },
  action: ActionDispatcher,
  ...payload: any[]
) {
  const actionPayload = action(...payload);
  this.collector.push(actionPayload);
};

export const oldActionBind = function(res: any, func: any) {
  self.COLLECTOR = [];
  pusherOverride();
  func(res);
  pusherOverride(true);
  return Promise.allSettled(self.COLLECTOR);
};

export const pusherOverride = (revert = false) => {
  const globalThis = { collector: self.COLLECTOR };
  Object.entries(self.GLOBAL_FUNCTIONS).forEach(([actionPath, globalFunc]) => {
    if (revert) {
      _.set(self, actionPath, globalFunc);
    } else {
      _.set(self, actionPath, pusher.bind(globalThis, globalFunc));
    }
  });
};

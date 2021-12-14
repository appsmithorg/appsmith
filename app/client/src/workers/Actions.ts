/* eslint-disable @typescript-eslint/ban-types */
import {
  ActionDispatcher,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { isAction, isAppsmithEntity, isTrueObject } from "./evaluationUtils";
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { promisifyAction } from "workers/PromisifyAction";

declare global {
  interface Window {
    REQUEST_ID?: string;
    ALLOW_ASYNC?: boolean;
    IS_ASYNC?: boolean;
    TRIGGER_COLLECTOR: ActionDescription[];
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
        const isOldSignature =
          typeof onSuccessOrParams === "function" ||
          typeof onError === "function";

        if (isOldSignature) {
          // Backwards compatibility
          return {
            type: ActionTriggerType.RUN_PLUGIN_ACTION,
            payload: {
              actionId: isAction(entity) ? entity.actionId : "",
              onSuccess: onSuccessOrParams
                ? onSuccessOrParams.toString()
                : undefined,
              onError: onError ? onError.toString() : undefined,
              params,
            },
          };
        } else {
          return promisifyAction({
            type: ActionTriggerType.RUN_PLUGIN_ACTION,
            payload: {
              actionId: isAction(entity) ? entity.actionId : "",
              params: isTrueObject(onSuccessOrParams) ? onSuccessOrParams : {},
            },
          });
        }
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
    return {
      type: ActionTriggerType.SET_INTERVAL,
      payload: {
        callback: callback.toString(),
        interval,
        id,
      },
    };
  },
  clearInterval: function(id: string) {
    return {
      type: ActionTriggerType.CLEAR_INTERVAL,
      payload: {
        id,
      },
    };
  },
  getGeoLocation: {
    qualifier: (entity) => isAppsmithEntity(entity),
    path: "appsmith.geolocation.getCurrentPosition",
    func: () =>
      function(
        successCallback?: () => unknown,
        errorCallback?: () => unknown,
        options?: {
          maximumAge?: number;
          timeout?: number;
          enableHighAccuracy?: boolean;
        },
      ) {
        const mainRequest = promisifyAction({
          type: ActionTriggerType.GET_CURRENT_LOCATION,
          payload: {
            options,
          },
        });
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
        return {
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
        };
      },
  },
  stopWatchGeoLocation: {
    qualifier: (entity) => isAppsmithEntity(entity),
    path: "appsmith.geolocation.clearWatch",
    func: () =>
      function() {
        return {
          type: ActionTriggerType.STOP_WATCHING_CURRENT_LOCATION,
        };
      },
  },
};

export const enhanceDataTreeWithFunctions = (
  dataTree: Readonly<DataTree>,
): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);

  Object.entries(DATA_TREE_FUNCTIONS).forEach(([name, funcOrFuncCreator]) => {
    if (
      typeof funcOrFuncCreator === "object" &&
      "qualifier" in funcOrFuncCreator
    ) {
      Object.entries(dataTree).forEach(([entityName, entity]) => {
        if (funcOrFuncCreator.qualifier(entity)) {
          const func = funcOrFuncCreator.func(entity);
          const funcName = funcOrFuncCreator.path || `${entityName}.${name}`;
          _.set(withFunction, funcName, pusher.bind(self, func));
        }
      });
    } else {
      _.set(withFunction, name, pusher.bind(self, funcOrFuncCreator));
    }
  });

  return withFunction;
};

export const pusher = function(
  this: { TRIGGER_COLLECTOR: ActionDescription[] },
  action: ActionDispatcher,
  ...payload: any[]
) {
  const actionPayload = action(...payload);
  if (actionPayload && "type" in actionPayload) {
    this.TRIGGER_COLLECTOR.push(actionPayload);
  } else {
    return actionPayload;
  }
};

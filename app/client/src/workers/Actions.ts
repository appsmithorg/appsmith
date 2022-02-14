/* eslint-disable @typescript-eslint/ban-types */
import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { isAction, isAppsmithEntity, isTrueObject } from "./evaluationUtils";
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { promisifyAction } from "workers/PromisifyAction";
const clone = require("rfdc/default");
declare global {
  interface Window {
    ALLOW_ASYNC?: boolean;
    IS_ASYNC?: boolean;
    TRIGGER_COLLECTOR: ActionDescription[];
  }
}

enum ExecutionType {
  PROMISE = "PROMISE",
  TRIGGER = "TRIGGER",
}

type ActionDescriptionWithExecutionType = ActionDescription & {
  executionType: ExecutionType;
};

type ActionDispatcherWithExecutionType = (
  ...args: any[]
) => ActionDescriptionWithExecutionType;

const DATA_TREE_FUNCTIONS: Record<
  string,
  | ActionDispatcherWithExecutionType
  | {
      qualifier: (entity: DataTreeEntity) => boolean;
      func: (entity: DataTreeEntity) => ActionDispatcherWithExecutionType;
      path?: string;
    }
> = {
  navigateTo: function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: NavigationTargetType,
  ) {
    return {
      type: ActionTriggerType.NAVIGATE_TO,
      payload: { pageNameOrUrl, params, target },
      executionType: ExecutionType.PROMISE,
    };
  },
  showAlert: function(
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return {
      type: ActionTriggerType.SHOW_ALERT,
      payload: { message, style },
      executionType: ExecutionType.PROMISE,
    };
  },
  showModal: function(modalName: string) {
    return {
      type: ActionTriggerType.SHOW_MODAL_BY_NAME,
      payload: { modalName },
      executionType: ExecutionType.PROMISE,
    };
  },
  closeModal: function(modalName: string) {
    return {
      type: ActionTriggerType.CLOSE_MODAL,
      payload: { modalName },
      executionType: ExecutionType.PROMISE,
    };
  },
  storeValue: function(key: string, value: string, persist = true) {
    // momentarily store this value in local state to support loops
    _.set(self, `appsmith.store[${key}]`, value);
    return {
      type: ActionTriggerType.STORE_VALUE,
      payload: { key, value, persist },
      executionType: ExecutionType.PROMISE,
    };
  },
  download: function(data: string, name: string, type: string) {
    return {
      type: ActionTriggerType.DOWNLOAD,
      payload: { data, name, type },
      executionType: ExecutionType.PROMISE,
    };
  },
  copyToClipboard: function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return {
      type: ActionTriggerType.COPY_TO_CLIPBOARD,
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
      executionType: ExecutionType.PROMISE,
    };
  },
  resetWidget: function(widgetName: string, resetChildren = true) {
    return {
      type: ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME,
      payload: { widgetName, resetChildren },
      executionType: ExecutionType.PROMISE,
    };
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
      ): ActionDescriptionWithExecutionType {
        const noArguments =
          !onSuccessOrParams && !onError && isTrueObject(params);
        const isNewSignature = noArguments || isTrueObject(onSuccessOrParams);

        const actionParams = isTrueObject(onSuccessOrParams)
          ? onSuccessOrParams
          : params;

        if (isNewSignature) {
          return {
            type: ActionTriggerType.RUN_PLUGIN_ACTION,
            payload: {
              actionId: isAction(entity) ? entity.actionId : "",
              params: actionParams,
            },
            executionType: ExecutionType.PROMISE,
          };
        }
        // Backwards compatibility
        return {
          type: ActionTriggerType.RUN_PLUGIN_ACTION,
          payload: {
            actionId: isAction(entity) ? entity.actionId : "",
            onSuccess: onSuccessOrParams
              ? onSuccessOrParams.toString()
              : undefined,
            onError: onError ? onError.toString() : undefined,
            params: actionParams,
          },
          executionType: ExecutionType.TRIGGER,
        };
      },
  },
  clear: {
    qualifier: (entity) => isAction(entity),
    func: (entity) =>
      function() {
        return {
          type: ActionTriggerType.CLEAR_PLUGIN_ACTION,
          payload: {
            actionId: isAction(entity) ? entity.actionId : "",
          },
          executionType: ExecutionType.PROMISE,
        };
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
      executionType: ExecutionType.TRIGGER,
    };
  },
  clearInterval: function(id: string) {
    return {
      type: ActionTriggerType.CLEAR_INTERVAL,
      payload: {
        id,
      },
      executionType: ExecutionType.TRIGGER,
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
        return {
          type: ActionTriggerType.GET_CURRENT_LOCATION,
          payload: {
            options,
            onError: errorCallback
              ? `{{${errorCallback.toString()}}}`
              : undefined,
            onSuccess: successCallback
              ? `{{${successCallback.toString()}}}`
              : undefined,
          },
          executionType:
            errorCallback || successCallback
              ? ExecutionType.TRIGGER
              : ExecutionType.PROMISE,
        };
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
          executionType: ExecutionType.TRIGGER,
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
          payload: {},
          executionType: ExecutionType.PROMISE,
        };
      },
  },
};

export const enhanceDataTreeWithFunctions = (
  dataTree: Readonly<DataTree>,
  requestId = "",
): DataTree => {
  const clonedDT = clone(dataTree);
  self.TRIGGER_COLLECTOR = [];
  Object.entries(DATA_TREE_FUNCTIONS).forEach(([name, funcOrFuncCreator]) => {
    if (
      typeof funcOrFuncCreator === "object" &&
      "qualifier" in funcOrFuncCreator
    ) {
      Object.entries(dataTree).forEach(([entityName, entity]) => {
        if (funcOrFuncCreator.qualifier(entity)) {
          const func = funcOrFuncCreator.func(entity);
          const funcName = `${funcOrFuncCreator.path ||
            `${entityName}.${name}`}`;
          _.set(
            clonedDT,
            funcName,
            pusher.bind(
              {
                TRIGGER_COLLECTOR: self.TRIGGER_COLLECTOR,
                REQUEST_ID: requestId,
              },
              func,
            ),
          );
        }
      });
    } else {
      _.set(
        clonedDT,
        name,
        pusher.bind(
          {
            TRIGGER_COLLECTOR: self.TRIGGER_COLLECTOR,
            REQUEST_ID: requestId,
          },
          funcOrFuncCreator,
        ),
      );
    }
  });

  return clonedDT;
};

/**
 * The Pusher function is created to decide the proper execution method
 * and payload of a platform action. It is bound to the platform functions and
 * get a requestId and TriggerCollector array in its "this" context.
 * Depending on the executionType of an action, it will add the action trigger description
 * in the correct place.
 *
 * For old trigger based functions, it will add it to the trigger collector to be executed in parallel
 * like the old way of action execution and end the evaluation.
 *
 * For new promise based functions, it will promisify the action so that it can wait for an execution
 * before resolving and moving on with the promise workflow
 *
 * **/
export const pusher = function(
  this: { TRIGGER_COLLECTOR: ActionDescription[]; REQUEST_ID: string },
  action: ActionDispatcherWithExecutionType,
  ...args: any[]
) {
  const actionDescription = action(...args);
  const { executionType, payload, type } = actionDescription;
  const actionPayload = {
    type,
    payload,
  } as ActionDescription;

  if (executionType && executionType === ExecutionType.TRIGGER) {
    this.TRIGGER_COLLECTOR.push(actionPayload);
  } else {
    return promisifyAction(this.REQUEST_ID, actionPayload);
  }
};

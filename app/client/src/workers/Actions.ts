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
import { isAction, isTrueObject } from "./evaluationUtils";
import { ActionTriggerType } from "entities/DataTree/actionTriggers";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";

const ctx: Worker = self as any;

declare global {
  interface Window {
    REQUEST_ID: string;
  }
}

const overThreadPromise = (event: any) => {
  return new Promise((resolve) => {
    ctx.postMessage({
      type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
      responseData: {
        trigger: event,
        errors: [],
      },
      requestId: self.REQUEST_ID,
    });
    ctx.addEventListener("message", (data) => {
      const { method } = data.data;
      if (method === EVAL_WORKER_ACTIONS.PROCESS_TRIGGER) {
        debugger;
        resolve.call(self, data.data.data);
      }
    });
  });
};

export const completePromise = () => {
  ctx.postMessage({
    type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
    responseData: {
      finished: true,
    },
    requestId: self.REQUEST_ID,
  });
};

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
    return overThreadPromise({
      type: ActionTriggerType.NAVIGATE_TO,
      payload: { pageNameOrUrl, params, target },
    });
  },
  showAlert: function(
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return overThreadPromise({
      type: ActionTriggerType.SHOW_ALERT,
      payload: { message, style },
    });
  },
  showModal: function(modalName: string) {
    return overThreadPromise({
      type: ActionTriggerType.SHOW_MODAL_BY_NAME,
      payload: { modalName },
    });
  },
  closeModal: function(modalName: string) {
    return overThreadPromise({
      type: ActionTriggerType.CLOSE_MODAL,
      payload: { modalName },
    });
  },
  storeValue: function(key: string, value: string, persist = true) {
    // momentarily store this value in local state to support loops
    _.set(self, `appsmith.store[${key}]`, value);
    return overThreadPromise({
      type: ActionTriggerType.STORE_VALUE,
      payload: { key, value, persist },
    });
  },
  download: function(data: string, name: string, type: string) {
    return overThreadPromise({
      type: ActionTriggerType.DOWNLOAD,
      payload: { data, name, type },
    });
  },
  copyToClipboard: function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return overThreadPromise({
      type: ActionTriggerType.COPY_TO_CLIPBOARD,
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
    });
  },
  resetWidget: function(widgetName: string, resetChildren = false) {
    return overThreadPromise({
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
        const runActionPromise = overThreadPromise({
          type: ActionTriggerType.RUN_PLUGIN_ACTION,
          payload: {
            actionId: isAction(entity) ? entity.actionId : "",
            params: isNewSignature ? onSuccessOrParams : params,
          },
        });
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
      return overThreadPromise({
        type: ActionTriggerType.CLEAR_PLUGIN_ACTION,
        payload: {
          actionId: isAction(entity) ? entity.actionId : "",
        },
      });
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
          const funcName = `${entityName}.${name}`;
          _.set(withFunction, funcName, func);
        }
      });
    } else {
      withFunction[name] = funcOrFuncCreator;
    }
  });

  return withFunction;
};

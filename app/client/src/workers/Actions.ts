/* eslint-disable @typescript-eslint/ban-types */
import {
  ActionDispatcher,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { isAction, isTrueObject } from "./evaluationUtils";
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";

const ctx: Worker = self as any;

declare global {
  interface Window {
    REQUEST_ID?: string;
    DRY_RUN?: boolean;
    IS_ASYNC?: boolean;
  }
}

/*
 * We wrap all actions with a promise. The promise will send a message to the main thread
 * and wait for a response till it can resolve or reject the promise. This way we can invoke actions
 * in the main thread while evaluating in the main thread. In principle, all actions now work as promises.
 *
 * needs a REQUEST_ID on global scope to know which request is going on right now
 */
const promisifyAction = (actionDescription: ActionDescription) => {
  if (self.DRY_RUN) {
    /**
     * To figure out if any function (JS action) is async, we do a dry run so that we can know if the function
     * is using a async action. We set an IS_ASYNC flag to later indicate that a promise was called.
     * @link isFunctionAsync
     * */
    self.IS_ASYNC = true;
    return new Promise((resolve) => resolve(true));
  }
  return new Promise((resolve, reject) => {
    // We create a new sub request id for each request going on so that we can resolve the correct one later on
    const subRequestId = _.uniqueId(`${self.REQUEST_ID}_`);
    ctx.postMessage({
      type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
      responseData: {
        trigger: actionDescription,
        errors: [],
        subRequestId,
      },
      requestId: self.REQUEST_ID,
    });
    ctx.addEventListener("message", (event) => {
      const { data, method, requestId, success } = event.data;
      if (
        method === EVAL_WORKER_ACTIONS.PROCESS_TRIGGER &&
        requestId === self.REQUEST_ID &&
        subRequestId === event.data.data.subRequestId
      ) {
        // If we get a response for this same promise we will resolve or reject it
        if (success) {
          resolve.apply(self, data.resolve);
        } else {
          reject(data.reason);
        }
      }
    });
  });
};

// To indicate the main thread that the processing of the trigger is done
// we send a finished message
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
  resetWidget: function(widgetName: string, resetChildren = false) {
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
          if (onSuccessOrParams) runActionPromise.then(onSuccessOrParams);
          if (onError) runActionPromise.catch(onError);
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

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
import { getEntityNameAndPropertyPath, isAction } from "./evaluationUtils";
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

export const pusher = function(
  this: { triggers: ActionDescription[] },
  action: any,
  ...payload: any[]
) {
  const actionPayload = action(...payload);
  debugger;
  if (actionPayload instanceof AppsmithPromise) {
    this.triggers.push(actionPayload.action);
    return actionPayload;
  } else {
    this.triggers.push(actionPayload);
  }
};

export const pusherOverride = (actionPath: string) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(actionPath);
  const overrideThis = { triggers: promiseTriggers };
  if (entityName === actionPath) {
    const action = _.get(DATA_TREE_FUNCTIONS, actionPath);
    if (action) {
      _.set(self, actionPath, pusher.bind({ ...overrideThis }, action));
    }
  } else {
    const entity = _.get(self, entityName);
    const funcCreator = DATA_TREE_FUNCTIONS[propertyPath];
    if (typeof funcCreator === "object" && "qualifier" in funcCreator) {
      const func = funcCreator.func(entity);
      _.set(self, actionPath, pusher.bind({ ...overrideThis }, func));
    }
  }
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
      executor();
      this.action.payload.executor = promiseTriggers;
      promiseTriggers = [];
      this._attachToSelfTriggers();
    } else {
      this.action.payload.executor = executor;
    }
    return this;
  }

  private _attachToSelfTriggers() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (self.triggers) {
      if (_.isNumber(this.triggerReference)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        self.triggers[this.triggerReference] = this.action;
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        self.triggers.push(this.action);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.triggerReference = self.triggers.length - 1;
      }
    }
  }

  then(executor?: Function) {
    if (executor) {
      this.action.payload.then.push(
        `{{ new Promise(${executor.toString()}) }}`,
      );
      this._attachToSelfTriggers();
    }
    return this;
  }

  catch(executor: Function) {
    if (executor) {
      this.action.payload.catch = `{{ new Promise(${executor.toString()}) }}`;
      this._attachToSelfTriggers();
    }
    return this;
  }

  finally(executor: Function) {
    if (executor) {
      this.action.payload.finally = `{{ new Promise(${executor.toString()}) }}`;
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
  resetWidget: function(widgetName: string, resetChildren = false) {
    return new AppsmithPromise([
      {
        type: ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME,
        payload: { widgetName, resetChildren },
      },
    ]);
  },
  run: {
    qualifier: isAction,
    func: (entity) =>
      function(onSuccess: Function, onError: Function, params = {}) {
        const runActionPromise = new AppsmithPromise([
          {
            type: ActionTriggerType.PLUGIN_ACTION,
            payload: {
              actionId: isAction(entity) ? entity.actionId : "",
              params,
            },
          },
        ]);
        if (onSuccess) runActionPromise.then(onSuccess);
        if (onError) runActionPromise.catch(onError);
        return runActionPromise;
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

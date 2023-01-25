/* eslint-disable @typescript-eslint/ban-types */
import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import {
  ActionDescription,
  ActionTriggerFunctionNames,
} from "@appsmith/entities/DataTree/actionTriggers";
import { isAction, isAppsmithEntity } from "./evaluationUtils";
import { EvalContext } from "workers/Evaluation/evaluate";
import { EvaluationVersion } from "api/ApplicationApi";
import { initIntervalFns } from "workers/Evaluation/fns/interval";
import { addFn } from "workers/Evaluation/fns/utils/fnGuard";
import run from "workers/Evaluation/fns/actionFns";
import { set } from "lodash";
import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";
import TriggerEmitter from "workers/Evaluation/fns/utils/TriggerEmitter";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";
import { promisifyAction } from "workers/Evaluation/fns/utils/PromisifyAction";
import { entityFns, platformFns } from "workers/Evaluation/fns";
declare global {
  /** All identifiers added to the worker global scope should also
   * be included in the DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS in
   * app/client/src/constants/WidgetValidation.ts
   * */

  interface Window {
    $allowAsync: boolean;
    $isAsync: boolean;
    $evaluationVersion: EvaluationVersion;
    TRIGGER_COLLECTOR: ActionDescription[];
  }
}

export enum ExecutionType {
  PROMISE = "PROMISE",
  TRIGGER = "TRIGGER",
}

export type ActionDescriptionWithExecutionType = ActionDescription & {
  executionType: ExecutionType;
};

export type ActionDispatcherWithExecutionType = (
  ...args: any[]
) => ActionDescriptionWithExecutionType;

const ENTITY_FUNCTIONS: Record<
  string,
  {
    qualifier: (entity: DataTreeEntity) => boolean;
    func: (entity: DataTreeEntity) => ActionDispatcherWithExecutionType;
    path?: string;
  }
> = {
  clear: {
    qualifier: (entity) => isAction(entity),
    func: (entity) =>
      function() {
        return {
          type: "CLEAR_PLUGIN_ACTION",
          payload: {
            actionId: isAction(entity) ? entity.actionId : "",
          },
          executionType: ExecutionType.PROMISE,
        };
      },
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
          type: "GET_CURRENT_LOCATION",
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
          type: "WATCH_CURRENT_LOCATION",
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
          type: "STOP_WATCHING_CURRENT_LOCATION",
          payload: {},
          executionType: ExecutionType.PROMISE,
        };
      },
  },
};

const entityFunctionEntries = Object.entries(ENTITY_FUNCTIONS);
/**
 * This method returns new dataTree with entity function and platform function
 */
export const addDataTreeToContext = (args: {
  EVAL_CONTEXT: EvalContext;
  dataTree: Readonly<DataTree>;
  skipEntityFunctions?: boolean;
  isTriggerBased: boolean;
}) => {
  const {
    dataTree,
    EVAL_CONTEXT,
    isTriggerBased,
    skipEntityFunctions = false,
  } = args;
  const dataTreeEntries = Object.entries(dataTree);
  const entityFunctionCollection: Record<string, Record<string, Function>> = {};

  self.TRIGGER_COLLECTOR = [];

  for (const [entityName, entity] of dataTreeEntries) {
    EVAL_CONTEXT[entityName] = entity;
    if (skipEntityFunctions || !isTriggerBased) continue;
    if (isAction(entity)) {
      set(entityFunctionCollection, `${entityName}.run`, run.bind(entity));
    }
    for (const entityFn of entityFns) {
      if (!entityFn.qualifier(entity)) continue;
      const func = entityFn.fn(entity);
      const fullPath = `${entityFn.path || `${entityName}.${entityFn.name}`}`;
      set(entityFunctionCollection, fullPath, func);
    }
  }

  // if eval is not trigger based i.e., sync eval then we skip adding entity and platform function to evalContext
  if (!isTriggerBased) return;

  for (const [entityName, funcObj] of Object.entries(
    entityFunctionCollection,
  )) {
    EVAL_CONTEXT[entityName] = Object.assign({}, dataTree[entityName], funcObj);
  }
};

export const addPlatformFunctionsToEvalContext = (context: any) => {
  for (const fnDef of platformFns) {
    addFn(context, fnDef.name, fnDef.fn);
  }
  initIntervalFns(context);
};

export const getAllAsyncFunctions = (dataTree: DataTree) => {
  const asyncFunctionNameMap: Record<string, true> = {};
  const dataTreeEntries = Object.entries(dataTree);
  for (const [entityName, entity] of dataTreeEntries) {
    if (isAction(entity)) {
      asyncFunctionNameMap[`${entityName}.run`];
    }
    for (const [functionName, funcCreator] of entityFunctionEntries) {
      if (!funcCreator.qualifier(entity)) continue;
      const fullPath = `${funcCreator.path || `${entityName}.${functionName}`}`;
      asyncFunctionNameMap[fullPath] = true;
    }
  }
  for (const name of Object.values(ActionTriggerFunctionNames)) {
    asyncFunctionNameMap[name] = true;
  }
  return asyncFunctionNameMap;
};

export const pusher = function(
  this: any,
  action: ActionDispatcherWithExecutionType,
  ...args: any[]
) {
  const actionDescription = action(...args);
  if (!self["$allowAsync"]) {
    self["$isAsync"] = true;
    const actionName = ActionTriggerFunctionNames[actionDescription.type];
    throw new ActionCalledInSyncFieldError(actionName);
  }
  const { executionType, ...trigger } = actionDescription;
  const executionMetaData = ExecutionMetaData.getExecutionMetaData();
  if (executionType && executionType === ExecutionType.TRIGGER) {
    TriggerEmitter.emit("process_batched_triggers", {
      trigger,
      ...executionMetaData,
    });
  } else {
    return promisifyAction(trigger, executionMetaData);
  }
};

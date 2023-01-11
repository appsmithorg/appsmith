/* eslint-disable @typescript-eslint/ban-types */
import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import set from "lodash/set";
import {
  ActionDescription,
  ActionTriggerFunctionNames,
} from "@appsmith/entities/DataTree/actionTriggers";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isAction, isAppsmithEntity, isTrueObject } from "./evaluationUtils";
import { EvalContext } from "workers/Evaluation/evaluate";
import { initStoreFns } from "workers/Evaluation/fns/storeFns";
import { EvaluationVersion } from "api/ApplicationApi";
import { initIntervalFns } from "workers/Evaluation/fns/interval";
import {
  PLATFORM_FUNCTIONS,
  promisifiedFnFactory,
} from "@appsmith/workers/Evaluation/PlatformFunctions";
import { TriggerMeta } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import { addFn } from "workers/Evaluation/fns/utils/fnGuard";
declare global {
  /** All identifiers added to the worker global scope should also
   * be included in the DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS in
   * app/client/src/constants/WidgetValidation.ts
   * */

  interface Window {
    $allowAsync: boolean;
    $isAsync: boolean;
    $metaData: {
      eventType?: EventType;
      triggerMeta?: TriggerMeta;
    };
    $evaluationVersion: EvaluationVersion;
    ALLOW_ASYNC?: boolean;
    IS_ASYNC?: boolean;
    TRIGGER_COLLECTOR: ActionDescription[];
  }
}

export enum ExecutionType {
  PROMISE = "PROMISE",
  TRIGGER = "TRIGGER",
}

const ENTITY_FUNCTIONS: Record<
  string,
  {
    qualifier: (entity: DataTreeEntity) => boolean;
    func: (entity: DataTreeEntity) => ActionDispatcherWithExecutionType;
    path?: string;
  }
> = {
  run: {
    qualifier: (entity) => isAction(entity),
    func: (entity) =>
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
            type: "RUN_PLUGIN_ACTION",
            payload: {
              actionId: isAction(entity) ? entity.actionId : "",
              params: actionParams,
            },
            executionType: ExecutionType.PROMISE,
          };
        }
        // Backwards compatibility
        return {
          type: "RUN_PLUGIN_ACTION",
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

const platformFunctionEntries = Object.entries(PLATFORM_FUNCTIONS);
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

    for (const [functionName, funcCreator] of entityFunctionEntries) {
      if (!funcCreator.qualifier(entity)) continue;
      const func = funcCreator.func(entity);
      const fullPath = `${funcCreator.path || `${entityName}.${functionName}`}`;
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
  for (const [funcName, fn] of platformFunctionEntries) {
    addFn(context, funcName, promisifiedFnFactory(funcName, fn));
  }
  initStoreFns(context);
  initIntervalFns(context);
};

export const getAllAsyncFunctions = (dataTree: DataTree) => {
  const asyncFunctionNameMap: Record<string, true> = {};
  const dataTreeEntries = Object.entries(dataTree);

  for (const [entityName, entity] of dataTreeEntries) {
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

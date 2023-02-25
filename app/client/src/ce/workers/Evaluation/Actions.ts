/* eslint-disable @typescript-eslint/ban-types */
import {
  DataTree,
  DataTreeEntity,
  DataTreeJSAction,
  DataTreeObjectEntity,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import set from "lodash/set";
import { EvalContext } from "workers/Evaluation/evaluate";
import JSProxy from "workers/Evaluation/JSObject/JSVariableProxy";
import { EvaluationVersion } from "api/ApplicationApi";
import { addFn } from "workers/Evaluation/fns/utils/fnGuard";
import {
  entityFns,
  getPlatformFunctions,
} from "@appsmith/workers/Evaluation/fns";
import { jsObjectCollection } from "workers/Evaluation/JSObject/Collection";
import { jsObjectFunctionFactory } from "workers/Evaluation/fns/utils/jsObjectFnFactory";
declare global {
  /** All identifiers added to the worker global scope should also
   * be included in the DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS in
   * app/client/src/constants/WidgetValidation.ts
   * */

  interface Window {
    $isDataField: boolean;
    $isAsync: boolean;
    $evaluationVersion: EvaluationVersion;
    $cloudHosting: boolean;
  }
}

export enum ExecutionType {
  PROMISE = "PROMISE",
  TRIGGER = "TRIGGER",
}

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

  for (const [entityName, entity] of dataTreeEntries) {
    setEntityToEvalContext(entity, entityName, EVAL_CONTEXT, isTriggerBased);

    if (skipEntityFunctions || !isTriggerBased) continue;
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
  for (const fnDef of getPlatformFunctions(self.$cloudHosting)) {
    addFn(context, fnDef.name, fnDef.fn.bind(context));
  }
};

export const getAllAsyncFunctions = (dataTree: DataTree) => {
  const asyncFunctionNameMap: Record<string, true> = {};
  const dataTreeEntries = Object.entries(dataTree);
  for (const [entityName, entity] of dataTreeEntries) {
    for (const entityFn of entityFns) {
      if (!entityFn.qualifier(entity)) continue;
      const fullPath = `${entityFn.path || `${entityName}.${entityFn.name}`}`;
      asyncFunctionNameMap[fullPath] = true;
    }
  }
  for (const platformFn of getPlatformFunctions(self.$cloudHosting)) {
    asyncFunctionNameMap[platformFn.name] = true;
  }
  return asyncFunctionNameMap;
};

function setEntityToEvalContext(
  entity: DataTreeEntity,
  entityName: string,
  EVAL_CONTEXT: EvalContext,
  isTriggerBased: boolean,
) {
  const dataTreeObjectEntity = entity as DataTreeObjectEntity;

  if (dataTreeObjectEntity.ENTITY_TYPE !== ENTITY_TYPE.JSACTION) {
    EVAL_CONTEXT[entityName] = entity;
    return;
  }

  const resolvedFunctions = jsObjectCollection.getResolvedFunctions();
  const resolvedObject = resolvedFunctions[entityName] || {};
  let varState: Record<string, any> = {};

  // Add variables
  for (const varName of dataTreeObjectEntity.variables) {
    varState[varName] = dataTreeObjectEntity[varName];
  }

  // If AsyncEval then add proxy
  if (!self.$isDataField) {
    varState = JSProxy.create(entity as DataTreeJSAction, entityName, varState);
  }

  // Add functions
  const jsObjectFuncs: Record<string, any> = {};
  for (const fnName of Object.keys(resolvedObject)) {
    const fn = resolvedObject[fnName];
    if (typeof fn !== "function") continue;
    // Investigate promisify of JSObject function confirmation
    // Task: https://github.com/appsmithorg/appsmith/issues/13289
    // Previous implementation commented code: https://github.com/appsmithorg/appsmith/pull/18471
    const data = dataTreeObjectEntity[fnName]?.data;
    jsObjectFuncs[fnName] = isTriggerBased
      ? jsObjectFunctionFactory(fn, entityName + "." + fnName)
      : fn;
    if (!!data) {
      jsObjectFuncs[fnName]["data"] = data;
    }
  }

  // set to evalContext
  EVAL_CONTEXT[entityName] = Object.assign(varState, jsObjectFuncs);
}

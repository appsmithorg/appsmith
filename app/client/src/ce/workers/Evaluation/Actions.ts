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
import { set } from "lodash";
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
    for (const entityFn of entityFns) {
      if (!entityFn.qualifier(entity)) continue;
      const fullPath = `${entityFn.path || `${entityName}.${entityFn.name}`}`;
      asyncFunctionNameMap[fullPath] = true;
    }
  }
  for (const platformFn of platformFns) {
    asyncFunctionNameMap[platformFn.name] = true;
  }
  return asyncFunctionNameMap;
};

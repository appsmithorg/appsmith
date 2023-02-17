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
import { jsObjectCollection } from "workers/Evaluation/JSObject/Collection";
import JSProxy from "workers/Evaluation/JSObject/JSVariableProxy";
import { EvaluationVersion } from "api/ApplicationApi";
import { addFn } from "workers/Evaluation/fns/utils/fnGuard";
import { entityFns, platformFns } from "@appsmith/workers/Evaluation/fns";
declare global {
  /** All identifiers added to the worker global scope should also
   * be included in the DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS in
   * app/client/src/constants/WidgetValidation.ts
   * */

  interface Window {
    $isDataField: boolean;
    $isAsync: boolean;
    $evaluationVersion: EvaluationVersion;
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
    setEntityToEvalContext(entity, entityName, EVAL_CONTEXT);

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
  for (const platformFn of platformFns) {
    asyncFunctionNameMap[platformFn.name] = true;
  }
  return asyncFunctionNameMap;
};

function setEntityToEvalContext(
  entity: DataTreeEntity,
  entityName: string,
  EVAL_CONTEXT: EvalContext,
) {
  const dataTreeObjectEntity = entity as DataTreeObjectEntity;

  if (dataTreeObjectEntity.ENTITY_TYPE) {
    switch (dataTreeObjectEntity.ENTITY_TYPE) {
      case ENTITY_TYPE.JSACTION: {
        const varState = jsObjectCollection.getCurrentVariableState(entityName);
        if (varState) {
          if (self.$isDataField) {
            EVAL_CONTEXT[entityName] = varState;
            return;
          }

          EVAL_CONTEXT[entityName] = JSProxy.create(
            entity as DataTreeJSAction,
            entityName,
            varState,
          );
          return;
        }
      }
    }
  }
  EVAL_CONTEXT[entityName] = entity;
}

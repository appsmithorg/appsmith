import { get, isEmpty, merge, set } from "lodash";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { getEvalValuePath } from "utils/DynamicBindingUtils";
import type { JSUpdate, ParsedJSSubAction } from "utils/JSPaneUtils";
import type DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  removeFunctionsAndVariableJSCollection,
  updateJSCollectionInUnEvalTree,
} from "workers/Evaluation/JSObject/utils";
import { dataTreeEvaluator } from "../handlers/evalTree";
import JSObjectCollection from "./Collection";
import { jsPropertiesState } from "./jsPropertiesState";
import type {
  JSActionEntity,
  JSActionEntityConfig,
} from "entities/DataTree/types";
// import { parser } from "./ScopeParser";

/**
 * Here we update our unEvalTree according to the change in JSObject's body
 *
 * @param jsUpdates
 * @param localUnEvalTree
 * @returns
 */
export const getUpdatedLocalUnEvalTreeAfterJSUpdates = (
  jsUpdates: Record<string, JSUpdate>,
  localUnEvalTree: DataTree,
  configTree: ConfigTree,
) => {
  if (!isEmpty(jsUpdates)) {
    Object.entries(jsUpdates).forEach(([entityName, jsEntity]) => {
      const entity = localUnEvalTree[entityName] as JSActionEntity;
      const parsedBody = jsEntity.parsedBody;
      if (isJSAction(entity)) {
        if (!!parsedBody) {
          //add/delete/update functions from dataTree
          localUnEvalTree = updateJSCollectionInUnEvalTree(
            parsedBody,
            entity,
            localUnEvalTree,
            configTree,
            entityName,
          );
        } else {
          //if parse error remove functions and variables from dataTree
          localUnEvalTree = removeFunctionsAndVariableJSCollection(
            localUnEvalTree,
            entity,
            entityName,
            configTree,
          );
        }
      }
    });
  }
  return localUnEvalTree;
};

export const validJSBodyRegex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);

/**
 * Here we parse the JSObject and then determine
 * 1. it's nature : async or sync
 * 2. Find arguments of JS Actions
 *
 * @param dataTreeEvalRef
 * @param entity
 * @param jsUpdates
 * @param unEvalDataTree
 * @param entityName
 * @returns
 */
export async function saveResolvedFunctionsAndJSUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: JSActionEntity,
  jsUpdates: Record<string, JSUpdate>,
  unEvalDataTree: DataTree,
  entityName: string,
) {
  jsPropertiesState.delete(entityName);
  const config = dataTreeEvalRef.configTree[entityName] as JSActionEntityConfig;
  let module = null;
  const actions: any = [];
  const variables: any = [];
  // const deps = parser.parse(entity.body);
  // debugger;
  try {
    module = await import(/* webpackIgnore: true */ config.url as string);
    const defaultExports = Object.keys(module.default || {});
    const namedExports = Object.keys(module).filter((key) => key !== "default");

    for (const key of [...namedExports, ...defaultExports]) {
      const value = module[key] || module.default?.[key];
      if (typeof value === "function") {
        JSObjectCollection.updateResolvedFunctions(
          `${entityName}.${key}`,
          value,
        );
        JSObjectCollection.updateUnEvalState(
          `${entityName}.${key}`,
          value.toString(),
        );
        actions.push({
          name: key,
          body: value.toString(),
          arguments: [],
          parsedFunction: value,
        });
      } else {
        variables.push({
          name: key,
          value: value,
        });
        JSObjectCollection.updateUnEvalState(`${entityName}.${key}`, value);
      }
      const parsedBody = {
        body: entity.body,
        actions: actions,
        variables,
      };
      set(jsUpdates, `${entityName}`, {
        parsedBody,
        id: entity.actionId,
      });
    }
  } catch (e) {
    set(jsUpdates, `${entityName}`, {
      parsedBody: undefined,
      id: entity.actionId,
    });
  }
  return jsUpdates;
}

export async function parseJSActions(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
  oldUnEvalTree?: DataTree,
  differences?: DataTreeDiff[],
) {
  const resolvedFunctions = JSObjectCollection.getResolvedFunctions();
  const unEvalState = JSObjectCollection.getUnEvalState();
  const jsUpdates: Record<string, JSUpdate> = {};

  if (!!differences && !!oldUnEvalTree) {
    for (const diff of differences) {
      const { entityName, propertyPath } = getEntityNameAndPropertyPath(
        diff.payload.propertyPath,
      );
      const entity = unEvalDataTree[entityName];

      if (!isJSAction(entity)) continue;

      if (diff.event === DataTreeDiffEvent.DELETE) {
        // when JSObject is deleted, we remove it from currentJSCollectionState & resolvedFunctions
        if (unEvalState && unEvalState[diff.payload.propertyPath]) {
          JSObjectCollection.deleteUnEvalState(diff.payload.propertyPath);
        }
        if (resolvedFunctions && resolvedFunctions[diff.payload.propertyPath]) {
          JSObjectCollection.deleteResolvedFunction(diff.payload.propertyPath);
        }
      }

      if (
        (diff.event === DataTreeDiffEvent.EDIT && propertyPath === "body") ||
        (diff.event === DataTreeDiffEvent.NEW && propertyPath === "")
      ) {
        await saveResolvedFunctionsAndJSUpdates(
          dataTreeEvalRef,
          entity,
          jsUpdates,
          unEvalDataTree,
          entityName,
        );
      }
    }
  } else {
    for (const entityName of Object.keys(unEvalDataTree)) {
      const entity = unEvalDataTree[entityName];
      if (!isJSAction(entity)) continue;
      await saveResolvedFunctionsAndJSUpdates(
        dataTreeEvalRef,
        entity,
        jsUpdates,
        unEvalDataTree,
        entityName,
      );
    }
  }

  Object.keys(jsUpdates).forEach((entityName) => {
    const parsedBody = jsUpdates[entityName].parsedBody;
    if (!parsedBody) return;
    parsedBody.actions = parsedBody.actions.map((action) => {
      return {
        ...action,
        // parsedFunction - used only to determine if function is async
        parsedFunction: undefined,
      } as ParsedJSSubAction;
    });
  });

  return { jsUpdates };
}

export function getJSEntities(dataTree: DataTree) {
  const jsCollections: Record<string, JSActionEntity> = {};
  Object.keys(dataTree).forEach((entityName: string) => {
    const entity = dataTree[entityName];
    if (isJSAction(entity)) {
      jsCollections[entityName] = entity;
    }
  });
  return jsCollections;
}

export function updateEvalTreeWithJSCollectionState(
  evalTree: DataTree,
  oldUnEvalTree: DataTree,
) {
  // loop through jsCollectionState and set all values to evalTree
  const jsCollections = JSObjectCollection.getVariableState();
  const jsCollectionEntries = Object.entries(jsCollections);
  for (const [jsObjectName, variableState] of jsCollectionEntries) {
    if (!evalTree[jsObjectName]) {
      evalTree[jsObjectName] = merge(
        {},
        oldUnEvalTree[jsObjectName],
        variableState,
      );
      continue;
    }
    evalTree[jsObjectName] = Object.assign(
      evalTree[jsObjectName],
      variableState,
    );
  }
}

export function updateEvalTreeValueFromContext(paths: string[][]) {
  const currentEvalContext = self;

  if (!dataTreeEvaluator) return;
  const evalTree = dataTreeEvaluator.getEvalTree();

  for (const fullPathArray of paths) {
    const [jsObjectName, variableName] = fullPathArray;
    const entity = evalTree[jsObjectName];
    if (jsObjectName && variableName && isJSAction(entity)) {
      if (!(jsObjectName in currentEvalContext)) continue;

      const variableValue = get(currentEvalContext, [
        jsObjectName,
        variableName,
      ]);
      const value = variableValue;
      JSObjectCollection.setVariableValue(
        value,
        `${jsObjectName}.${variableName}`,
      );
      /*
      JSobject variable values are picked from evalProps until the unevalValue is not modified.
      Hence, we need to set the value in evalProps to ensure it doesn't have stale values.
      */
      set(
        dataTreeEvaluator.evalProps,
        getEvalValuePath(`${jsObjectName}.${variableName}`, {
          isPopulated: true,
          fullPath: true,
        }),
        value,
      );
    }
  }
}

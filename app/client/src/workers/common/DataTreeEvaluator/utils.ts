import {
  getEntityNameAndPropertyPath,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  EXECUTION_PARAM_REFERENCE_REGEX,
  THIS_DOT_PARAMS_KEY,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import type DependencyMap from "entities/DependencyMap";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
} from "@appsmith/entities/DataTree/types";
import { isObject } from "lodash";

export function getFixedTimeDifference(endTime: number, startTime: number) {
  return (endTime - startTime).toFixed(2) + " ms";
}
export function isDataField(fullPath: string, configTree: ConfigTree) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entityConfig = configTree[entityName];
  if (entityConfig && "triggerPaths" in entityConfig) {
    return !(propertyPath in entityConfig.triggerPaths);
  }
  return false;
}

export function replaceThisDotParams(code: string) {
  return code.replace(EXECUTION_PARAM_REFERENCE_REGEX, THIS_DOT_PARAMS_KEY);
}

export function getAllAsyncJSFunctions(
  unevalTree: DataTree,
  jsPropertiesState: TJSPropertiesState,
  dependencyMap: DependencyMap,
  allAsyncNodes: string[],
) {
  const allAsyncJSFunctions: string[] = [];
  for (const [entityName, entity] of Object.entries(unevalTree)) {
    if (!isJSAction(entity)) continue;
    const jsEntityState = jsPropertiesState[entityName];
    if (!jsEntityState) continue;
    for (const [propertyName, propertyState] of Object.entries(jsEntityState)) {
      if (!("isMarkedAsync" in propertyState)) continue;
      if (propertyState.isMarkedAsync) {
        allAsyncJSFunctions.push(`${entityName}.${propertyName}`);
        continue;
      } else {
        const reacheableAsyncNodes = dependencyMap.getAllReachableNodes(
          `${entityName}.${propertyName}`,
          allAsyncNodes,
        );
        reacheableAsyncNodes.length &&
          allAsyncJSFunctions.push(`${entityName}.${propertyName}`);
      }
    }
  }
  return allAsyncJSFunctions;
}

export function isValidEntity(
  entity: DataTreeEntity,
): entity is DataTreeEntityObject {
  if (!isObject(entity)) {
    return false;
  }
  return true;
}

export function getValidEntityType(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
) {
  let entityType;
  if (isValidEntity(entity)) {
    entityType =
      (!!entityConfig && entityConfig.ENTITY_TYPE) || entity.ENTITY_TYPE;
  }
  return !!entityType ? entityType : "noop";
}

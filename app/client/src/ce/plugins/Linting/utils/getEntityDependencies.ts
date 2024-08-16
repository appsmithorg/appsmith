import {
  addWidgetPropertyDependencies,
  convertPathToString,
  getEntityNameAndPropertyPath,
} from "ee/workers/Evaluation/evaluationUtils";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { DependencyMap as TDependencyMap } from "utils/DynamicBindingUtils";
import { getPropertyPath } from "utils/DynamicBindingUtils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import { mergeMaps } from "plugins/Linting/utils/mergeMaps";
import { flatten, get, has, isString, toPath, union, uniq } from "lodash";
import { extractIdentifierInfoFromCode } from "@shared/ast";
import { PathUtils } from "plugins/Linting/utils/pathUtils";

import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { ActionEntity } from "plugins/Linting/lib/entity/ActionEntity";
import type { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";
import type { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";
import type { IEntity } from "ee/plugins/Linting/lib/entity/types";

export const getDependencies: Record<
  string,
  (entity: IEntity) => TDependencyMap
> = {
  [ENTITY_TYPE.ACTION]: (entity) =>
    getActionDependencies(entity as ActionEntity),
  [ENTITY_TYPE.JSACTION]: (entity) => getJSDependencies(entity as JSEntity),
  [ENTITY_TYPE.WIDGET]: (entity) =>
    getWidgetDependencies(entity as WidgetEntity),
};

export const getPathDependencies: Record<
  string,
  (entity: IEntity, fullPropertyPath: string) => TDependencyMap
> = {
  [ENTITY_TYPE.ACTION]: (entity, fullPropertyPath) =>
    getActionPropertyPathDependencies(entity as ActionEntity, fullPropertyPath),
  [ENTITY_TYPE.JSACTION]: (entity, fullPropertyPath) =>
    getJSPropertyPathDependencies(entity as JSEntity, fullPropertyPath),
  [ENTITY_TYPE.WIDGET]: (entity, fullPropertyPath) =>
    getWidgetPropertyPathDependencies(entity as WidgetEntity, fullPropertyPath),
};

export function getEntityDependencies(
  entity: IEntity,
): TDependencyMap | undefined {
  const entityType = entity.getType();
  const getDependenciesMethod = getDependencies[entityType];
  return getDependenciesMethod && getDependenciesMethod(entity);
}

function getWidgetDependencies(widgetEntity: WidgetEntity): TDependencyMap {
  let dependencies: TDependencyMap = {};
  const widgetConfig = widgetEntity.getConfig();
  const widgetName = widgetEntity.getName();

  const widgetInternalDependencies = addWidgetPropertyDependencies({
    widgetConfig,
    widgetName,
  });

  dependencies = mergeMaps(dependencies, widgetInternalDependencies);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(widgetConfig);
  const dynamicTriggerPathList = widgetConfig.dynamicTriggerPathList || [];
  const allDynamicPaths = union(dynamicTriggerPathList, dynamicBindingPathList);

  for (const dynamicPath of allDynamicPaths) {
    const propertyPath = dynamicPath.key;
    const dynamicPathDependency = getDependencyFromEntityPath(
      propertyPath,
      widgetEntity,
    );
    dependencies = mergeMaps(dependencies, dynamicPathDependency);
  }

  return dependencies;
}
function getJSDependencies(jsEntity: JSEntity): TDependencyMap {
  let dependencies: TDependencyMap = {};
  const jsActionConfig = jsEntity.getConfig();
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};

  for (const reactivePath of Object.keys(jsActionReactivePaths)) {
    const reactivePathDependency = getDependencyFromEntityPath(
      reactivePath,
      jsEntity,
    );
    dependencies = mergeMaps(dependencies, reactivePathDependency);
  }
  const jsEntityInternalDependencyMap =
    getEntityInternalDependencyMap(jsEntity);
  dependencies = mergeMaps(dependencies, jsEntityInternalDependencyMap);
  return dependencies;
}
function getActionDependencies(actionEntity: ActionEntity): TDependencyMap {
  let dependencies: TDependencyMap = {};
  const actionConfig = actionEntity.getConfig();

  const actionInternalDependencyMap =
    getEntityInternalDependencyMap(actionEntity);
  dependencies = mergeMaps(dependencies, actionInternalDependencyMap);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const dynamicPathDependency = getDependencyFromEntityPath(
      propertyPath,
      actionEntity,
    );
    dependencies = mergeMaps(dependencies, dynamicPathDependency);
  }

  return dependencies;
}

export function getDependencyFromEntityPath(
  propertyPath: string,
  entity: IEntity,
): TDependencyMap {
  const unevalPropValue = get(
    entity.getRawEntity(),
    propertyPath,
    "",
  ).toString();
  const entityName = entity.getName();
  const { jsSnippets } = getDynamicBindings(unevalPropValue);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);
  const dynamicPathDependency: TDependencyMap = {
    [`${entityName}.${propertyPath}`]: validJSSnippets,
  };
  return dynamicPathDependency;
}

function getEntityInternalDependencyMap(entity: IEntity) {
  const entityConfig = entity.getConfig();
  const entityName = entity.getName();
  const dependencies: TDependencyMap = {};
  const internalDependencyMap: TDependencyMap = entityConfig
    ? (entityConfig as Record<string, TDependencyMap>).dependencyMap
    : {};

  for (const [path, pathDependencies] of Object.entries(
    internalDependencyMap,
  )) {
    const fullPropertyPath = `${entityName}.${path}`;
    const fullPathDependencies = pathDependencies.map(
      (dependentPath) => `${entityName}.${dependentPath}`,
    );
    dependencies[fullPropertyPath] = fullPathDependencies;
  }
  return dependencies;
}

export function getEntityPathDependencies(
  entity: IEntity,
  fullPropertyPath: string,
) {
  const entityType = entity.getType();
  const getPathDependenciesMethod = getPathDependencies[entityType];
  return (
    getPathDependenciesMethod &&
    getPathDependenciesMethod(entity, fullPropertyPath)
  );
}
function getWidgetPropertyPathDependencies(
  widgetEntity: WidgetEntity,
  fullPropertyPath: string,
): TDependencyMap {
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);
  const widgetConfig = widgetEntity.getConfig();

  const dynamicBindingPathList = getEntityDynamicBindingPathList(widgetConfig);
  const dynamicTriggerPathList = widgetConfig.dynamicTriggerPathList || [];
  const allDynamicPaths = union(dynamicTriggerPathList, dynamicBindingPathList);
  const isPathADynamicPath =
    allDynamicPaths.find(
      (dynamicPath) => dynamicPath.key === entityPropertyPath,
    ) !== undefined;

  if (!isPathADynamicPath) return {};

  const dynamicPathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    widgetEntity,
  );

  return dynamicPathDependency;
}
function getJSPropertyPathDependencies(
  jsEntity: JSEntity,
  fullPropertyPath: string,
): TDependencyMap {
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);
  const jsActionConfig = jsEntity.getConfig();
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};
  const isPathAReactivePath =
    Object.keys(jsActionReactivePaths).find(
      (path) => path === entityPropertyPath,
    ) !== undefined;
  if (!isPathAReactivePath) return {};

  const reactivePathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    jsEntity,
  );
  return reactivePathDependency;
}
function getActionPropertyPathDependencies(
  actionEntity: ActionEntity,
  fullPropertyPath: string,
): TDependencyMap {
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);
  const actionConfig = actionEntity.getConfig();

  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);
  const isADynamicPath = dynamicBindingPathList.find(
    (path) => path.key === entityPropertyPath,
  );

  if (!isADynamicPath) return {};

  const dynamicPathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    actionEntity,
  );

  return dynamicPathDependency;
}

export function extractReferencesFromPath(
  entity: IEntity,
  fullPropertyPath: string,
  tree: Record<string, unknown>,
) {
  if (!PathUtils.isDynamicLeaf(entity, fullPropertyPath)) return [];
  const entityPropertyPath = getPropertyPath(fullPropertyPath);
  const rawEntity = entity.getRawEntity() as DataTreeEntity;
  const propertyPathContent = get(rawEntity, entityPropertyPath);
  if (!isString(propertyPathContent)) return [];

  const { jsSnippets } = getDynamicBindings(propertyPathContent, rawEntity);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  const referencesInPropertyPath = flatten(
    validJSSnippets.map((jsSnippet) =>
      extractReferencesFromJSSnippet(jsSnippet, tree),
    ),
  );
  return referencesInPropertyPath;
}

export function extractReferencesFromJSSnippet(
  jsSnippet: string,
  tree: Record<string, unknown>,
) {
  const { references } = extractIdentifierInfoFromCode(jsSnippet, 2);
  const prunedReferences = flatten(
    references.map((reference) => getPrunedReference(reference, tree)),
  );
  return uniq(prunedReferences);
}

function getPrunedReference(
  reference: string,
  tree: Record<string, unknown>,
): string[] {
  if (has(tree, reference)) {
    return [reference];
  }
  const subpaths = toPath(reference);
  let currentString = "";
  const references = [];
  // We want to keep going till we reach top level
  while (subpaths.length > 0) {
    currentString = convertPathToString(subpaths);
    references.push(currentString);
    // We've found the dep, add it and return
    if (has(tree, currentString)) {
      return references;
    }
    subpaths.pop();
  }

  return references;
}

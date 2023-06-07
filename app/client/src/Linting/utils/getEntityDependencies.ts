import type {
  ActionEntity,
  JSEntity,
  TEntity,
  WidgetEntity,
} from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import {
  addWidgetPropertyDependencies,
  convertPathToString,
  getEntityNameAndPropertyPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { ENTITY_TYPE } from "entities/DataTree/types";
import type { DependencyMap as TDependencyMap } from "utils/DynamicBindingUtils";
import { getPropertyPath } from "utils/DynamicBindingUtils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import { mergeMaps } from "./mergeMaps";
import { flatten, get, isString, toPath, union, uniq } from "lodash";
import { isDynamicLeaf } from "./entityPath";
import { extractIdentifierInfoFromCode } from "@shared/ast";

export function getEntityDependencies(
  entity: TEntity,
): TDependencyMap | undefined {
  switch (entity.getType()) {
    case ENTITY_TYPE.ACTION:
      return getActionDependencies(entity as ActionEntity);
    case ENTITY_TYPE.JSACTION:
      return getJSDependencies(entity as JSEntity);
    case ENTITY_TYPE.WIDGET:
      return getWidgetDependencies(entity as WidgetEntity);
    default:
      return undefined;
  }
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

function getDependencyFromEntityPath(
  propertyPath: string,
  entity: TEntity,
): TDependencyMap {
  const unevalPropValue = get(
    isJSEntity(entity) ? entity.getParsedEntity() : entity.getRawEntity(),
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

function getEntityInternalDependencyMap(entity: TEntity) {
  const entityConfig = entity.getConfig();
  const entityName = entity.getName();
  const dependencies: TDependencyMap = {};
  const internalDependencyMap: TDependencyMap = entityConfig
    ? entityConfig.dependencyMap
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
  entity: TEntity,
  fullPropertyPath: string,
) {
  switch (entity.getType()) {
    case ENTITY_TYPE.ACTION:
      return getActionPropertyPathDependencies(
        entity as ActionEntity,
        fullPropertyPath,
      );
    case ENTITY_TYPE.JSACTION:
      return getJSPropertyPathDependencies(
        entity as JSEntity,
        fullPropertyPath,
      );
    case ENTITY_TYPE.WIDGET:
      return getWidgetPropertyPathDependencies(
        entity as WidgetEntity,
        fullPropertyPath,
      );
    default:
      return undefined;
  }
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
  entity: TEntity,
  fullPropertyPath: string,
  allPaths: Record<string, true>,
) {
  if (!isDynamicLeaf(entity, fullPropertyPath)) return [];
  const entityPropertyPath = getPropertyPath(fullPropertyPath);
  const propertyPathContent = get(entity, entityPropertyPath);
  if (!isString(propertyPathContent)) return [];

  const { jsSnippets } = getDynamicBindings(
    propertyPathContent,
    entity.getRawEntity(),
  );
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  const referencesInPropertyPath = flatten(
    validJSSnippets.map((jsSnippet) =>
      extractReferencesFromJSSnippet(jsSnippet, allPaths),
    ),
  );
  return referencesInPropertyPath;
}

export function extractReferencesFromJSSnippet(
  jsSnippet: string,
  allPaths: Record<string, true>,
) {
  const { references } = extractIdentifierInfoFromCode(jsSnippet, 2);
  const prunedReferences = references.map((reference) =>
    getPrunedReference(reference, allPaths),
  );
  return uniq(prunedReferences);
}

function getPrunedReference(
  reference: string,
  allPaths: Record<string, true>,
): string {
  if (allPaths.hasOwnProperty(reference)) {
    return reference;
  }
  const subpaths = toPath(reference);
  let currentString = "";
  // We want to keep going till we reach top level, but not add top level
  // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
  // This is mainly to avoid a lot of unnecessary dependency.
  while (subpaths.length > 1) {
    currentString = convertPathToString(subpaths);
    // We've found the dep, add it and return
    if (allPaths.hasOwnProperty(currentString)) {
      return currentString;
    }
    subpaths.pop();
  }

  return reference;
}

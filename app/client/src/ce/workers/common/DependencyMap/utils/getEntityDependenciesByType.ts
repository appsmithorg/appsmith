import {
  addWidgetPropertyDependencies,
  getEntityNameAndPropertyPath,
  isATriggerPath,
} from "ee/workers/Evaluation/evaluationUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type {
  ActionEntity,
  ActionEntityConfig,
  JSActionEntity,
  JSActionEntityConfig,
  DataTreeEntityConfig,
  WidgetEntity,
  WidgetEntityConfig,
} from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { find, union } from "lodash";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import type { DataTreeEntityObject } from "ee/entities/DataTree/types";
import { getDependencyFromEntityPath } from "workers/common/DependencyMap/utils/getEntityDependencies";

export const getDependencies = {
  [ENTITY_TYPE.ACTION]: (
    entity: DataTreeEntityObject,
    entityConfig: DataTreeEntityConfig,
    allKeys: Record<string, true>,
  ) => {
    return getActionDependencies(
      entity as ActionEntity,
      entityConfig as ActionEntityConfig,
      allKeys,
    );
  },
  [ENTITY_TYPE.JSACTION]: (
    entity: DataTreeEntityObject,
    entityConfig: DataTreeEntityConfig,
    allKeys: Record<string, true>,
  ) => {
    return getJSDependencies(
      entity as JSActionEntity,
      entityConfig as JSActionEntityConfig,
      allKeys,
    );
  },
  [ENTITY_TYPE.WIDGET]: (
    entity: DataTreeEntityObject,
    entityConfig: DataTreeEntityConfig,
  ) => {
    return getWidgetDependencies(
      entity as WidgetEntity,
      entityConfig as WidgetEntityConfig,
    );
  },
};

export function getWidgetDependencies(
  widgetEntity: WidgetEntity,
  widgetConfig: WidgetEntityConfig,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const widgetName = widgetEntity.widgetName;
  const widgetInternalDependencies = addWidgetPropertyDependencies({
    widgetConfig,
    widgetName,
  });

  dependencies = { ...widgetInternalDependencies };

  const dependencyMap = widgetConfig.dependencyMap;

  for (const source in dependencyMap) {
    if (!dependencyMap.hasOwnProperty(source)) continue;
    const targetPaths = dependencyMap[source];
    const fullPropertyPath = `${widgetName}.${source}`;
    dependencies[fullPropertyPath] = dependencies[fullPropertyPath] || [];
    dependencies[fullPropertyPath].push(
      ...targetPaths.map((p) => `${widgetName}.${p}`),
    );
  }

  const dynamicBindingPathList = getEntityDynamicBindingPathList(widgetConfig);
  const dynamicTriggerPathList = widgetConfig.dynamicTriggerPathList || [];

  for (const { key } of dynamicTriggerPathList) {
    dependencies[`${widgetName}.${key}`] = [];
  }

  for (const bindingPath of dynamicBindingPathList) {
    const propertyPath = bindingPath.key;
    const fullPropertyPath = `${widgetName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      widgetEntity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDeps = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDeps };
  }

  return dependencies;
}
export function getJSDependencies(
  jsEntity: JSActionEntity,
  jsActionConfig: JSActionEntityConfig,
  allKeys: Record<string, true>,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};
  const jsActionDependencyMap = jsActionConfig.dependencyMap || {};
  const jsObjectName = jsActionConfig.name || "";

  for (const [propertyPath, pathDeps] of Object.entries(
    jsActionDependencyMap,
  )) {
    const fullPropertyPath = `${jsObjectName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps
      .map((dependentPath) => `${jsObjectName}.${dependentPath}`)
      .filter((path) => allKeys.hasOwnProperty(path));
    dependencies[fullPropertyPath] = propertyPathDependencies;
  }

  for (const reactivePath of Object.keys(jsActionReactivePaths)) {
    const fullPropertyPath = `${jsObjectName}.${reactivePath}`;
    const reactivePathDependencies = getDependencyFromEntityPath(
      reactivePath,
      jsEntity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDeps = union(existingDeps, reactivePathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDeps };
  }

  return dependencies;
}
export function getActionDependencies(
  actionEntity: ActionEntity,
  actionConfig: ActionEntityConfig,
  allKeys: Record<string, true>,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const actionName = actionConfig.name;
  const actionDependencyMap = actionConfig.dependencyMap || {};
  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);

  for (const [propertyPath, pathDeps] of Object.entries(actionDependencyMap)) {
    const fullPropertyPath = `${actionName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps
      .map((dependentPath) => `${actionName}.${dependentPath}`)
      .filter((path) => allKeys.hasOwnProperty(path));
    dependencies[fullPropertyPath] = propertyPathDependencies;
  }

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const fullPropertyPath = `${actionName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      actionEntity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDependencies = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDependencies };
  }

  return dependencies;
}

export const getPathDependencies = {
  [ENTITY_TYPE.ACTION]: (
    entity: DataTreeEntity,
    entityConfig: DataTreeEntityConfig,
    fullPropertyPath: string,
    allKeys: Record<string, true>,
  ) => {
    return getActionPropertyPathDependencies(
      entity as ActionEntity,
      entityConfig as ActionEntityConfig,
      fullPropertyPath,
      allKeys,
    );
  },
  [ENTITY_TYPE.JSACTION]: (
    entity: DataTreeEntity,
    entityConfig: DataTreeEntityConfig,
    fullPropertyPath: string,
    allKeys: Record<string, true>,
  ) => {
    return getJSPropertyPathDependencies(
      entity as JSActionEntity,
      entityConfig as JSActionEntityConfig,
      fullPropertyPath,
      allKeys,
    );
  },
  [ENTITY_TYPE.WIDGET]: (
    entity: DataTreeEntity,
    entityConfig: DataTreeEntityConfig,
    fullPropertyPath: string,
  ) => {
    return getWidgetPropertyPathDependencies(
      entity as WidgetEntity,
      entityConfig as WidgetEntityConfig,
      fullPropertyPath,
    );
  },
};

function getWidgetPropertyPathDependencies(
  widgetEntity: WidgetEntity,
  widgetConfig: WidgetEntityConfig,
  fullPropertyPath: string,
) {
  let dependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const dynamicBindingPathList = getEntityDynamicBindingPathList(widgetConfig);
  const bindingPaths = widgetConfig.bindingPaths || {};
  const widgetInternalDependencies = addWidgetPropertyDependencies({
    widgetConfig,
    widgetName: widgetEntity.widgetName,
  });
  const widgetPathInternalDependencies =
    widgetInternalDependencies[fullPropertyPath];

  dependencies = union(dependencies, widgetPathInternalDependencies);
  if (isATriggerPath(widgetConfig, propertyPath)) return dependencies;
  const isPathADynamicPath =
    bindingPaths.hasOwnProperty(propertyPath) ||
    find(dynamicBindingPathList, { key: propertyPath });

  if (!isPathADynamicPath) return dependencies;

  const dynamicPathDependencies = getDependencyFromEntityPath(
    propertyPath,
    widgetEntity,
  );
  dependencies = union(dependencies, dynamicPathDependencies);

  return dependencies;
}
function getJSPropertyPathDependencies(
  jsEntity: JSActionEntity,
  jsActionConfig: JSActionEntityConfig,
  fullPropertyPath: string,
  allKeys: Record<string, true>,
) {
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};
  let dependencies: string[] = [];
  const jsInternalDependencyMap = jsActionConfig.dependencyMap || {};
  const jsPathInternalDependencies =
    jsInternalDependencyMap[propertyPath]
      ?.map((dep) => `${jsActionConfig.name}.${dep}`)
      ?.filter((path) => allKeys.hasOwnProperty(path)) || [];

  dependencies = union(dependencies, jsPathInternalDependencies);

  if (jsActionReactivePaths.hasOwnProperty(propertyPath)) {
    const propertyPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      jsEntity,
    );
    dependencies = union(dependencies, propertyPathDependencies);
  }
  return dependencies;
}
function getActionPropertyPathDependencies(
  actionEntity: ActionEntity,
  actionConfig: ActionEntityConfig,
  fullPropertyPath: string,
  allKeys: Record<string, true>,
) {
  let actionPathDependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const actionInternalDependencyMap = actionConfig.dependencyMap || {};
  const actionPathInternalDependencies =
    actionInternalDependencyMap[propertyPath]
      ?.map((dep) => `${actionConfig.name}.${dep}`)
      .filter((path) => allKeys.hasOwnProperty(path)) || [];
  actionPathDependencies = union(
    actionPathDependencies,
    actionPathInternalDependencies,
  );

  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);
  const bindingPaths = actionConfig.bindingPaths;

  const isADynamicPath =
    bindingPaths.hasOwnProperty(propertyPath) ||
    find(dynamicBindingPathList, { key: propertyPath });

  if (!isADynamicPath) return actionPathDependencies;

  const dynamicPathDependencies = getDependencyFromEntityPath(
    propertyPath,
    actionEntity,
  );
  actionPathDependencies = union(
    actionPathDependencies,
    dynamicPathDependencies,
  );

  return actionPathDependencies;
}

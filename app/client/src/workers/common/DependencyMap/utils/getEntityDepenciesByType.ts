import { addWidgetPropertyDependencies } from "@appsmith/workers/Evaluation/evaluationUtils";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type {
  ActionEntity,
  ActionEntityConfig,
  JSActionEntity,
  JSActionEntityConfig,
  DataTreeEntityConfig,
  WidgetEntity,
  WidgetEntityConfig,
} from "@appsmith/entities/DataTree/types";
import { union } from "lodash";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import type { DataTreeEntityObject } from "@appsmith/entities/DataTree/types";
import { getDependencyFromEntityPath } from "./getEntityDependencies";

export const getDependencies = {
  [ENTITY_TYPE_VALUE.ACTION]: (
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
  [ENTITY_TYPE_VALUE.JSACTION]: (
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
  [ENTITY_TYPE_VALUE.WIDGET]: (
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

import {
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
import { getDependencyFromEntityPath } from "@evaluation/dependency";
import { addWidgetPropertyDependencies } from "@evaluation/dependency";

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
  const { propertyOverrideDependency } = widgetConfig;
  const widgetInternalDependencies = addWidgetPropertyDependencies({
    propertyOverrideDependency,
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

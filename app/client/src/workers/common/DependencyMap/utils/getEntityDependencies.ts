import {
  addWidgetPropertyDependencies,
  getEntityNameAndPropertyPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  DataTreeEntityConfig,
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import {
  ENTITY_TYPE,
  type DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import type {
  ActionEntity,
  ActionEntityConfig,
  JSActionEntity,
  JSActionEntityConfig,
} from "entities/DataTree/types";
import { get, union } from "lodash";
import {
  getDynamicBindings,
  getEntityDynamicBindingPathList,
} from "utils/DynamicBindingUtils";
import { isWidgetActionOrJsObject } from "workers/common/DataTreeEvaluator/utils";

export function getEntityDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
): Record<string, string[]> {
  if (!isWidgetActionOrJsObject(entity)) return {};
  switch (entity.ENTITY_TYPE) {
    case ENTITY_TYPE.ACTION:
      return getActionDependencies(entity, entityConfig as ActionEntityConfig);
    case ENTITY_TYPE.JSACTION:
      return getJSDependencies(entity, entityConfig as JSActionEntityConfig);
    case ENTITY_TYPE.WIDGET:
      return getWidgetDependencies(
        entity as WidgetEntity,
        entityConfig as WidgetEntityConfig,
      );
    default:
      return {};
  }
}
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
  const allDynamicPaths = union(dynamicTriggerPathList, dynamicBindingPathList);

  for (const dynamicPath of allDynamicPaths) {
    const propertyPath = dynamicPath.key;
    const dynamicPathDependency = getDependencyFromEntityPath(
      propertyPath,
      widgetEntity,
    );
    dependencies = { ...dependencies, [propertyPath]: dynamicPathDependency };
  }

  return dependencies;
}
export function getJSDependencies(
  jsEntity: JSActionEntity,
  jsActionConfig: JSActionEntityConfig,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};

  for (const reactivePath of Object.keys(jsActionReactivePaths)) {
    const reactivePathDependency = getDependencyFromEntityPath(
      reactivePath,
      jsEntity,
    );
    dependencies = { [reactivePath]: reactivePathDependency };
  }
  const jsEntityInternalDependencyMap = getEntityInternalDependencyMap(
    jsActionConfig.name,
    jsActionConfig,
  );
  dependencies = { ...dependencies, ...jsEntityInternalDependencyMap };
  return dependencies;
}
export function getActionDependencies(
  actionEntity: ActionEntity,
  actionConfig: ActionEntityConfig,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};

  const actionInternalDependencyMap = getEntityInternalDependencyMap(
    actionConfig.name,
    actionConfig,
  );
  dependencies = { ...actionInternalDependencyMap };

  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const dynamicPathDependency = getDependencyFromEntityPath(
      propertyPath,
      actionEntity,
    );
    dependencies = { ...dependencies, [propertyPath]: dynamicPathDependency };
  }

  return dependencies;
}

export function getEntityPathDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  fullPropertyPath: string,
) {
  if (!isWidgetActionOrJsObject(entity)) return [];
  switch (entity.ENTITY_TYPE) {
    case ENTITY_TYPE.ACTION:
      return getActionPropertyPathDependencies(
        entity,
        entityConfig as ActionEntityConfig,
        fullPropertyPath,
      );
    case ENTITY_TYPE.JSACTION:
      return getJSPropertyPathDependencies(
        entity,
        entityConfig as JSActionEntityConfig,
        fullPropertyPath,
      );
    case ENTITY_TYPE.WIDGET:
      return getWidgetPropertyPathDependencies(
        entity,
        entityConfig as WidgetEntityConfig,
        fullPropertyPath,
      );
    default:
      return [];
  }
}

function getWidgetPropertyPathDependencies(
  widgetEntity: WidgetEntity,
  widgetConfig: WidgetEntityConfig,
  fullPropertyPath: string,
) {
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(widgetConfig);
  const dynamicTriggerPathList = widgetConfig.dynamicTriggerPathList || [];
  const allDynamicPaths = union(dynamicTriggerPathList, dynamicBindingPathList);
  const isPathADynamicPath =
    allDynamicPaths.find(
      (dynamicPath) => dynamicPath.key === entityPropertyPath,
    ) !== undefined;

  if (!isPathADynamicPath) return [];

  const dynamicPathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    widgetEntity,
  );

  return dynamicPathDependency;
}
function getJSPropertyPathDependencies(
  jsEntity: JSActionEntity,
  jsActionConfig: JSActionEntityConfig,
  fullPropertyPath: string,
) {
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};
  const isPathAReactivePath =
    Object.keys(jsActionReactivePaths).find(
      (path) => path === entityPropertyPath,
    ) !== undefined;
  if (!isPathAReactivePath) return [];

  const reactivePathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    jsEntity,
  );
  return reactivePathDependency;
}
function getActionPropertyPathDependencies(
  actionEntity: ActionEntity,
  actionConfig: ActionEntityConfig,
  fullPropertyPath: string,
) {
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);
  const isADynamicPath = dynamicBindingPathList.find(
    (path) => path.key === entityPropertyPath,
  );

  if (!isADynamicPath) return [];

  const dynamicPathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    actionEntity,
  );

  return dynamicPathDependency;
}

function getDependencyFromEntityPath(
  propertyPath: string,
  entity: DataTreeEntity,
) {
  const unevalPropValue = get(entity, propertyPath, "").toString();
  const { jsSnippets } = getDynamicBindings(unevalPropValue, entity);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  return validJSSnippets;
}

function getEntityInternalDependencyMap(
  entityName: string,
  entityConfig: DataTreeEntityConfig,
) {
  const dependencies: Record<string, string[]> = {};
  const internalDependencyMap: Record<string, string[]> = entityConfig
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

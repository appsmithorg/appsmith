import type {
  ActionEntity,
  JSEntity,
  TEntity,
  WidgetEntity,
} from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { addWidgetPropertyDependencies } from "@appsmith/workers/Evaluation/evaluationUtils";
import { ENTITY_TYPE } from "entities/DataTree/types";
import type { DependencyMap as TDependencyMap } from "utils/DynamicBindingUtils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import { mergeMaps } from "./mergeMaps";
import { get, union } from "lodash";

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
export function getWidgetDependencies(
  widgetEntity: WidgetEntity,
): TDependencyMap {
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
export function getJSDependencies(jsEntity: JSEntity): TDependencyMap {
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
export function getActionDependencies(
  actionEntity: ActionEntity,
): TDependencyMap {
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

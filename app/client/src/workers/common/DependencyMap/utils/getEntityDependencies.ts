import {
  addWidgetPropertyDependencies,
  getEntityNameAndPropertyPath,
  isATriggerPath,
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
import { find, get, union } from "lodash";
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
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};
  const jsActionDependencyMap = jsActionConfig.dependencyMap || {};
  const jsObjectName = jsActionConfig.name || "";

  for (const [propertyPath, pathDeps] of Object.entries(
    jsActionDependencyMap,
  )) {
    const fullPropertyPath = `${jsObjectName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps.map(
      (dependentPath) => `${jsObjectName}.${dependentPath}`,
    );
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
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const actionName = actionConfig.name;
  const actionDependencyMap = actionConfig.dependencyMap || {};
  const dynamicBindingPathList = getEntityDynamicBindingPathList(actionConfig);

  for (const [propertyPath, pathDeps] of Object.entries(actionDependencyMap)) {
    const fullPropertyPath = `${actionName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps.map(
      (dependentPath) => `${actionName}.${dependentPath}`,
    );
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
) {
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const jsActionBindingPaths = jsActionConfig.bindingPaths || {};
  let dependencies: string[] = [];
  const jsInternalDependencyMap = jsActionConfig.dependencyMap || {};
  const jsPathInternalDependencies =
    jsInternalDependencyMap[propertyPath]?.map(
      (dep) => `${jsActionConfig.name}.${dep}`,
    ) || [];

  dependencies = union(dependencies, jsPathInternalDependencies);

  if (jsActionBindingPaths.hasOwnProperty(propertyPath)) {
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
) {
  let actionPathDependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const actionInternalDependencyMap = actionConfig.dependencyMap || {};
  const actionPathInternalDependencies =
    actionInternalDependencyMap[propertyPath]?.map(
      (dep) => `${actionConfig.name}.${dep}`,
    ) || [];
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

function getDependencyFromEntityPath(
  propertyPath: string,
  entity: DataTreeEntity,
) {
  const unevalPropValue = get(entity, propertyPath, "").toString();
  const { jsSnippets } = getDynamicBindings(unevalPropValue, entity);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  return validJSSnippets;
}

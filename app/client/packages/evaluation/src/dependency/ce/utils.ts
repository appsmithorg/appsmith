import type {
  ActionConfig,
  EntityConfig,
  JSConfig,
  WidgetConfig,
} from "./types";
import union from "lodash/union";
import type { OverrideDependency } from "../../common";
import get from "lodash/get";
import { getDynamicBindings } from "../../dynamicBinding";

export function getDependencyFromEntityPath(
  propertyPath: string,
  entity: {
    ENTITY_TYPE: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  },
) {
  const unevalPropValue = get(entity, propertyPath, "").toString();
  const { jsSnippets } = getDynamicBindings(unevalPropValue, entity);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  return validJSSnippets;
}

export function getActionDependencies(
  actionEntity: {
    ENTITY_TYPE: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  },
  actionConfig: ActionConfig,
  allKeys: Record<string, true>,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const actionName = actionConfig.name;
  const actionDependencyMap = actionConfig.dependencyMap ?? {};
  const { dynamicBindingPathList = [] } = actionConfig;

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

export function getJSDependencies(
  jsEntity: {
    ENTITY_TYPE: string;
  },
  jsActionConfig: JSConfig,
  allKeys: Record<string, true>,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const jsActionReactivePaths = jsActionConfig.reactivePaths ?? {};
  const jsActionDependencyMap = jsActionConfig.dependencyMap ?? {};
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

export const addWidgetPropertyDependencies = ({
  propertyOverrideDependency,
  widgetName,
}: {
  propertyOverrideDependency: Record<string, Partial<OverrideDependency>>;
  widgetName?: string;
}) => {
  const dependencies: Record<string, string[]> = {};

  Object.entries(propertyOverrideDependency).forEach(
    ([overriddenPropertyKey, overridingPropertyKeyMap]) => {
      const existingDependenciesSet = new Set(
        dependencies[`${widgetName}.${overriddenPropertyKey}`] ?? [],
      );
      // add meta dependency
      overridingPropertyKeyMap.META &&
        existingDependenciesSet.add(
          `${widgetName}.${overridingPropertyKeyMap.META}`,
        );
      // add default dependency
      overridingPropertyKeyMap.DEFAULT &&
        existingDependenciesSet.add(
          `${widgetName}.${overridingPropertyKeyMap.DEFAULT}`,
        );

      dependencies[`${widgetName}.${overriddenPropertyKey}`] = [
        ...existingDependenciesSet,
      ];
    },
  );
  return dependencies;
};

export function getWidgetDependencies(
  widgetEntity: {
    ENTITY_TYPE: string;
    widgetName?: string;
  },
  widgetConfig: WidgetConfig,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const widgetName = widgetEntity.widgetName;
  const {
    dynamicBindingPathList = [],
    dynamicTriggerPathList = [],
    propertyOverrideDependency,
  } = widgetConfig;
  const widgetInternalDependencies = addWidgetPropertyDependencies({
    propertyOverrideDependency,
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

export const EntityDependencyGetterMap = {
  ["ACTION" as string]: (
    entity: { ENTITY_TYPE: string },
    entityConfig: EntityConfig,
    allKeys: Record<string, true>,
  ) => {
    return getActionDependencies(entity, entityConfig as ActionConfig, allKeys);
  },
  ["JSACTION" as string]: (
    entity: { ENTITY_TYPE: string },
    entityConfig: EntityConfig,
    allKeys: Record<string, true>,
  ) => {
    return getJSDependencies(entity, entityConfig as JSConfig, allKeys);
  },
  ["WIDGET" as string]: (
    entity: { ENTITY_TYPE: string },
    entityConfig: EntityConfig,
  ) => {
    return getWidgetDependencies(entity, entityConfig as WidgetConfig);
  },
};

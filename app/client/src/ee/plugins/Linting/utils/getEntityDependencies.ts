export * from "ce/plugins/Linting/utils/getEntityDependencies";
import {
  getDependencyFromEntityPath,
  getEntityPathDependencies as CE_getEntityPathDependencies,
  getDependencies as CE_getDependencies,
} from "ce/plugins/Linting/utils/getEntityDependencies";
import type { IEntity } from "../lib/entity/types";
import { ENTITY_TYPE_VALUE } from "@appsmith/entities/DataTree/types";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  type EntityWithBindings,
  getEntityDynamicBindingPathList,
  type DependencyMap as TDependencyMap,
} from "utils/DynamicBindingUtils";
import { mergeMaps } from "plugins/Linting/utils/mergeMaps";
import type { ModuleInputsEntity } from "../lib/entity/ModuleInputsEntity";

export const getDependencies: Record<
  string,
  (entity: IEntity) => TDependencyMap
> = {
  ...CE_getDependencies,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (entity) =>
    getModuleInputsDependencies(entity as ModuleInputsEntity),
};

export const getPathDependencies: Record<
  string,
  (entity: IEntity, fullPropertyPath: string) => TDependencyMap
> = {
  ...CE_getEntityPathDependencies,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (entity, fullPropertyPath) =>
    getModuleInputsPathDependencies(
      entity as ModuleInputsEntity,
      fullPropertyPath,
    ),
};

export function getEntityDependencies(
  entity: IEntity,
): TDependencyMap | undefined {
  const entityType = entity.getType();
  const getDependenciesMethod = getDependencies[entityType];
  return getDependenciesMethod && getDependenciesMethod(entity);
}

export function getModuleInputsDependencies(entity: IEntity) {
  let dependencies: TDependencyMap = {};
  const entityConfig = entity.getConfig();

  const dynamicBindingPathList = getEntityDynamicBindingPathList(
    entityConfig as EntityWithBindings,
  );

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      entity,
    );
    dependencies = mergeMaps(dependencies, dynamicPathDependencies);
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

export function getModuleInputsPathDependencies(
  entity: ModuleInputsEntity,
  fullPropertyPath: string,
) {
  const entityConfig = entity.getConfig();
  const { propertyPath: entityPropertyPath } =
    getEntityNameAndPropertyPath(fullPropertyPath);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);

  const isADynamicPath = dynamicBindingPathList.find(
    (path) => path.key === entityPropertyPath,
  );

  if (!isADynamicPath) return {};

  const dynamicPathDependency = getDependencyFromEntityPath(
    entityPropertyPath,
    entity,
  );

  return dynamicPathDependency;
}

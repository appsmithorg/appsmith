export * from "ce/workers/common/DependencyMap/utils/getEntityDependenciesByType";

import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
  ModuleInputsConfig,
  ModuleInputsEntity,
} from "@appsmith/entities/DataTree/types";
import {
  getDependencies as CE_getDependencies,
  getPathDependencies as CE_getPathDependencies,
} from "ce/workers/common/DependencyMap/utils/getEntityDependenciesByType";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import { getDependencyFromEntityPath } from "workers/common/DependencyMap/utils/getEntityDependencies";
import { find, union } from "lodash";
import { getEntityNameAndPropertyPath } from "ce/workers/Evaluation/evaluationUtils";

export const getDependencies = {
  ...CE_getDependencies,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (
    entity: DataTreeEntityObject,
    entityConfig: DataTreeEntityConfig,
  ) => {
    return getModuleInputsDependencies(
      entity as ModuleInputsEntity,
      entityConfig as ModuleInputsConfig,
    );
  },
};

export function getModuleInputsDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
) {
  const entityName = entityConfig.name;
  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);
  let dependencies: Record<string, string[]> = {};

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const fullPropertyPath = `${entityName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      entity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDependencies = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDependencies };
  }
  return dependencies;
}

export const getPathDependencies = {
  ...CE_getPathDependencies,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (
    entity: DataTreeEntity,
    entityConfig: DataTreeEntityConfig,
    fullPropertyPath: string,
  ) => {
    return getModuleInputsPathDependencies(
      entity as ModuleInputsEntity,
      entityConfig as ModuleInputsConfig,
      fullPropertyPath as string,
    );
  },
};

export function getModuleInputsPathDependencies(
  entity: ModuleInputsEntity,
  entityConfig: ModuleInputsConfig,
  fullPropertyPath: string,
) {
  let dependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);
  const bindingPaths = entityConfig.bindingPaths || {};

  const isADynamicPath =
    bindingPaths.hasOwnProperty(propertyPath) ||
    find(dynamicBindingPathList, { key: propertyPath });

  if (!isADynamicPath) return dependencies;

  const dynamicPathDependencies = getDependencyFromEntityPath(
    propertyPath,
    entity,
  );
  dependencies = union(dependencies, dynamicPathDependencies);

  return dependencies;
}

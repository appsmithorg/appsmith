import type { TEntity } from "Linting/lib/entity";
import { isWidgetEntity } from "Linting/lib/entity";
import { isDynamicEntity } from "Linting/lib/entity";
import {
  convertPathToString,
  getAllPaths,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { find, get, toPath } from "lodash";

export function isDynamicLeaf(entity: TEntity, fullPropertyPath: string) {
  const [entityName, ...propPathEls] = toPath(fullPropertyPath);
  // Framework feature: Top level items are never leaves
  if (entityName === fullPropertyPath) return false;

  const entityConfig = entity.getConfig();

  if (!isDynamicEntity(entity) || !entityConfig) return false;
  const relativePropertyPath = convertPathToString(propPathEls);
  return (
    relativePropertyPath in entityConfig.reactivePaths ||
    (isWidgetEntity(entity) &&
      relativePropertyPath in entity.getConfig().triggerPaths)
  );
}

export function getAllPathsFromNode(
  node: string,
  tree: Record<string, unknown>,
) {
  const obj = {
    [node]: get(tree, node),
  };
  return getAllPaths(obj);
}
export function isPathADynamicBinding(
  entity: TEntity,
  entityPropertyPath: string,
) {
  if (!isDynamicEntity(entity)) return false;
  const entityDynamicBindingPathList =
    entity.getConfig().dynamicBindingPathList || [];
  return (
    find(entityDynamicBindingPathList, { key: entityPropertyPath }) !==
    undefined
  );
}

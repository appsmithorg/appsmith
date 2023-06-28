import type { IEntity } from "plugins/Linting/lib/entity";
import { isDynamicEntity } from "plugins/Linting/lib/entity";
import { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";
import { find, get } from "lodash";

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
  entity: IEntity,
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

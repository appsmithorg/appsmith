import { DataTree } from "entities/DataTree/dataTreeFactory";
import { has } from "lodash";
import { isJSAction } from "workers/evaluationUtils";

export function isJSObjectFunction(
  dataTree: DataTree,
  jsObjectName: string,
  key: string,
) {
  const entity = dataTree[jsObjectName];
  if (isJSAction(entity)) {
    return entity.meta.hasOwnProperty(key);
  }
  return false;
}

export function isPathPresent(obj: unknown, path: string) {
  return has(obj, path);
}

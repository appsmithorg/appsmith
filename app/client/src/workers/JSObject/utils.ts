import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { isJSAction } from "workers/evaluationUtils";

export function getJSEntities(dataTree: DataTree) {
  const jsCollections: Record<string, DataTreeJSAction> = {};
  Object.keys(dataTree).forEach((key: string) => {
    const entity = dataTree[key];
    if (isJSAction(entity)) {
      jsCollections[entity.name] = entity;
    }
  });
  return jsCollections;
}

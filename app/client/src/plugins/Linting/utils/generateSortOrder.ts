import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { TEntityTree } from "./entityTree";
import { PathUtils } from "./pathUtils";

export function getDynamicNodes(nodes: string[], entityTree: TEntityTree) {
  const dynamicNodes = new Set<string>();
  for (const node of nodes) {
    const { entityName } = getEntityNameAndPropertyPath(node);
    const entity = entityTree[entityName];
    if (!entity) continue;
    if (PathUtils.isDynamicLeaf(entity, node)) {
      dynamicNodes.add(node);
    }
  }
  return Array.from(dynamicNodes);
}

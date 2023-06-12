import {
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { DataTreeDiff } from "./translateEntityTreeDiffs";
import { getAllPathsFromNode, isDynamicLeaf } from "./entityPath";
import { lintingDependencyMap } from "./lintingDependencyMap";
import type { TEntityTree, TEntityTreeWithParsedJS } from "./entityTree";

export function generateSortOrder(
  translatedDiffs: DataTreeDiff[],
  entityTreeWithParsedJS: TEntityTreeWithParsedJS,
  entityTree: TEntityTree,
) {
  const sortOrder: string[] = [];

  for (const translatedDiff of translatedDiffs) {
    const fullPropertyPath = translatedDiff.payload.propertyPath;
    switch (translatedDiff.event) {
      case DataTreeDiffEvent.DELETE:
        {
          const allDeletedNodes = getAllPathsFromNode(
            fullPropertyPath,
            entityTreeWithParsedJS,
          );
          const invalidDependenciesInverse =
            lintingDependencyMap.getInvalidDependenciesInverse();
          for (const deletedNode of Object.keys(allDeletedNodes)) {
            const dependentNodes = invalidDependenciesInverse.get(deletedNode);
            if (!dependentNodes) continue;
            for (const dependentNode of dependentNodes) {
              sortOrder.push(dependentNode);
            }
          }
        }
        break;
      case DataTreeDiffEvent.EDIT:
        {
          sortOrder.push(fullPropertyPath);
        }
        break;
      case DataTreeDiffEvent.NEW:
        {
          const allAddedNodes = getAllPathsFromNode(
            fullPropertyPath,
            entityTreeWithParsedJS,
          );
          const dependencies = lintingDependencyMap.getDependencies();
          for (const addedNode of Object.keys(allAddedNodes)) {
            sortOrder.push(addedNode);
            const dependentNodes = dependencies.get(addedNode);
            if (!dependentNodes) continue;
            for (const dependentNode of dependentNodes) {
              sortOrder.push(dependentNode);
            }
          }
        }
        break;
    }
  }
  return getDynamicNodes(sortOrder, entityTree);
}
export function getDynamicNodes(nodes: string[], entityTree: TEntityTree) {
  const dynamicNodes = new Set<string>();
  for (const node of nodes) {
    const { entityName } = getEntityNameAndPropertyPath(node);
    const entity = entityTree[entityName];
    if (!entity) continue;
    if (isDynamicLeaf(entity, node)) {
      dynamicNodes.add(node);
    }
  }
  return Array.from(dynamicNodes);
}

import type { DataTree, ConfigTree } from "entities/DataTree/dataTreeTypes";
import {
  getEntityNameAndPropertyPath,
  isATriggerPath,
  isDynamicLeaf,
  isJSAction,
} from "ee/workers/Evaluation/evaluationUtils";

export default function sortLintingPathsByType(
  pathsToLint: string[],
  unevalTree: DataTree,
  configTree: ConfigTree,
) {
  const triggerPaths = new Set<string>();
  const bindingPaths = new Set<string>();
  const jsObjectPaths = new Set<string>();

  for (const fullPropertyPath of pathsToLint) {
    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(fullPropertyPath);
    const entity = unevalTree[entityName];
    const entityConfig = configTree[entityName];

    if (isJSAction(entity)) {
      jsObjectPaths.add(fullPropertyPath);
      continue;
    }

    // We are only interested in dynamic leaves
    if (!isDynamicLeaf(unevalTree, fullPropertyPath, configTree)) continue;
    if (isATriggerPath(entityConfig, propertyPath)) {
      triggerPaths.add(fullPropertyPath);
      continue;
    }

    bindingPaths.add(fullPropertyPath);
  }

  return { triggerPaths, bindingPaths, jsObjectPaths };
}

import type { DataTree, ConfigTree } from "entities/DataTree/dataTreeTypes";
import {
  getEntityNameAndPropertyPath,
  isATriggerPath,
  isDynamicLeaf,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { WidgetEntityConfig } from "@appsmith/entities/DataTree/types";

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

    // We are only interested in adding lint errors to paths edited by users
    // System generated code doesn't require linting
    if (
      isWidget(entity) &&
      (entityConfig as WidgetEntityConfig).derivedProperties.hasOwnProperty(
        propertyPath,
      )
    ) {
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

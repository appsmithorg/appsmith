import type { DependencyMap as TDependencyMap } from "utils/DynamicBindingUtils";
import {
  extractReferencesFromJSSnippet,
  extractReferencesFromPath,
  getEntityDependencies,
  getEntityPathDependencies,
} from "./getEntityDependencies";
import type { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";
import { DataTreeDiffEvent } from "@appsmith/workers/Evaluation/evaluationUtils";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { flatten } from "lodash";
import DependencyMap from "entities/DependencyMap";
import type { TEntityTree, TEntityTreeWithParsedJS } from "./entityTree";
import { getAllPathsFromNode, isDynamicLeaf } from "./entityPath";
import type { DataTreeDiff } from "./translateEntityTreeDiffs";

export const lintingDependencyMap = new DependencyMap();
export function createDependency(
  entityTree: TEntityTree,
  allPaths: ReturnType<typeof getAllPaths>,
) {
  // Create all nodes
  lintingDependencyMap.addNodes(allPaths);

  // Create dependency map
  for (const entity of Object.values(entityTree)) {
    const entityDependencies = getEntityDependencies(entity);
    updateDependencies(entityDependencies, allPaths);
  }
  return lintingDependencyMap.getDependencies();
}
export function updateDependency(
  translatedDiffs: DataTreeDiff[],
  entityTree: TEntityTree,
  cachedEntityTree: TEntityTree,
  entityTreeWithParsedJS: TEntityTreeWithParsedJS,
  allPaths: ReturnType<typeof getAllPaths>,
) {
  for (const translatedDiff of translatedDiffs) {
    const { event, payload } = translatedDiff;
    const { propertyPath: fullPropertyPath } = payload;
    const { entityName } = getEntityNameAndPropertyPath(fullPropertyPath);
    const tree =
      event === DataTreeDiffEvent.DELETE ? cachedEntityTree : entityTree;
    const entity = tree[entityName];

    if (event === DataTreeDiffEvent.NOOP || !entity) continue;

    switch (event) {
      case DataTreeDiffEvent.EDIT:
        {
          const referencesInPath = extractReferencesFromPath(
            entity,
            fullPropertyPath,
            allPaths,
          );
          lintingDependencyMap.addDependency(
            fullPropertyPath,
            referencesInPath,
          );
        }
        break;
      case DataTreeDiffEvent.DELETE:
        {
          const allDeletedPaths = getAllPathsFromNode(
            fullPropertyPath,
            entityTreeWithParsedJS,
          );
          lintingDependencyMap.removeNodes(allDeletedPaths);
        }
        break;
      case DataTreeDiffEvent.NEW:
        {
          const allAddedPaths = getAllPathsFromNode(
            fullPropertyPath,
            entityTreeWithParsedJS,
          );
          lintingDependencyMap.addNodes(allAddedPaths);
          for (const addedPath of Object.keys(allAddedPaths)) {
            const dependencies = isDynamicLeaf(entity, addedPath)
              ? getEntityPathDependencies(entity, addedPath)
              : getEntityDependencies(entity);
            updateDependencies(dependencies, allPaths);
          }
        }
        break;
    }
  }
  return lintingDependencyMap.getDependencies();
}

export function addAppsmithGlobalFnsToDependencyMap(
  appsmithglobalFns: string[],
) {
  const globalFunctionNodes = appsmithglobalFns.reduce(
    (globalFns, functionNode) => {
      return { ...globalFns, [functionNode]: true } as const;
    },
    {} as Record<string, true>,
  );
  lintingDependencyMap.addNodes(globalFunctionNodes);
}
function updateDependencies(
  dependencies: TDependencyMap | undefined,
  allPaths: ReturnType<typeof getAllPaths>,
) {
  if (!dependencies) return;
  for (const [propertyPath, dependenciesInPath] of Object.entries(
    dependencies,
  )) {
    const referencesInPropertyPath = flatten(
      dependenciesInPath.map((dependency) =>
        extractReferencesFromJSSnippet(dependency, allPaths),
      ),
    );

    lintingDependencyMap.addDependency(propertyPath, referencesInPropertyPath);
  }
}

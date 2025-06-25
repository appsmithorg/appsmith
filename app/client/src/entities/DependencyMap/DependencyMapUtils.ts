import toposort from "toposort";
import type DependencyMap from ".";
import {
  entityTypeCheckForPathDynamicTrigger,
  getEntityNameAndPropertyPath,
  IMMEDIATE_PARENT_REGEX,
} from "ee/workers/Evaluation/evaluationUtils";
import type { ConfigTree } from "entities/DataTree/dataTreeTypes";
import { isPathDynamicTrigger } from "utils/DynamicBindingUtils";

type SortDependencies =
  | {
      success: true;
      sortedDependencies: string[];
    }
  | { success: false; cyclicNode: string; error: unknown };

export class DependencyMapUtils {
  // inspired by https://www.npmjs.com/package/toposort#sorting-dependencies
  static sortDependencies(
    dependencyMap: DependencyMap,
    configTree?: ConfigTree,
  ): SortDependencies {
    const dependencyTree: Array<[string, string | undefined]> = [];
    const dependencies = dependencyMap.rawDependencies;

    for (const [node, deps] of dependencies.entries()) {
      if (deps.size) {
        deps.forEach((dep) => dependencyTree.push([node, dep]));
      } else {
        // Set no dependency
        dependencyTree.push([node, undefined]);
      }
    }

    try {
      const sortedDependencies = toposort(dependencyTree)
        .reverse()
        .filter((edge) => !!edge);

      if (configTree) {
        this.detectReactiveDependencyMisuse(dependencyMap, configTree);
      }

      return { success: true, sortedDependencies };
    } catch (error) {
      // Add 1 second delay using setTimeout
      if (
        error instanceof Error &&
        error.message.includes("Reactive dependency misuse")
      ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return {
          success: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cyclicNode: (error as any).node,
          error,
        };
      }

      // Cyclic dependency found. Extract node
      const cyclicNodes = (error as Error).message.match(
        new RegExp('Cyclic dependency, node was:"(.*)"'),
      );
      const node = cyclicNodes ? cyclicNodes[1] : "";

      return { success: false, cyclicNode: node, error };
    }
  }
  // this function links childNode to its parent as a dependency for the entire dependencyGraph
  static makeParentsDependOnChildren(dependencyMap: DependencyMap) {
    const dependencies = dependencyMap.rawDependencies;

    for (const [node, deps] of dependencies.entries()) {
      this.makeParentsDependOnChild(dependencyMap, node);
      deps.forEach((dep) => {
        this.makeParentsDependOnChild(dependencyMap, dep);
      });
    }

    return dependencyMap;
  }

  // this function links childNode to its parent as a dependency for only affectedNodes in the graph
  static linkAffectedChildNodesToParent(
    dependencyMap: DependencyMap,
    affectedSet: Set<string>,
  ) {
    const dependencies = dependencyMap.rawDependencies;

    for (const [node, deps] of dependencies.entries()) {
      if (affectedSet.has(node)) {
        DependencyMapUtils.makeParentsDependOnChild(dependencyMap, node);
      }

      deps.forEach((dep) => {
        if (affectedSet.has(dep)) {
          DependencyMapUtils.makeParentsDependOnChild(dependencyMap, dep);
        }
      });
    }

    return dependencyMap;
  }

  static makeParentsDependOnChild = (
    dependencyMap: DependencyMap,
    child: string,
  ) => {
    // Skip adding dependencies for paths containing .data
    if (child.includes(".data")) {
      return;
    }

    let curKey = child;
    let matches: string[] | null;

    while ((matches = curKey.match(IMMEDIATE_PARENT_REGEX)) !== null) {
      const immediateParent = matches[1];
      const existingImmediateParentDeps =
        dependencyMap.getDirectDependencies(immediateParent) || [];
      const existingImmediateParentDepsSet = new Set(
        existingImmediateParentDeps,
      );

      // Add child to immediate parent's dependencies if not already present
      // don't perform addDependency unnecessarily
      if (!existingImmediateParentDepsSet.has(curKey)) {
        existingImmediateParentDeps.push(curKey);
        dependencyMap.addDependency(
          immediateParent,
          existingImmediateParentDeps,
        );
      }

      curKey = immediateParent;
    }
  };

  static isTriggerPath(path: string, configTree: ConfigTree) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
    const entityConfig = configTree[entityName];

    if (!entityConfig) {
      return false;
    }

    if (entityTypeCheckForPathDynamicTrigger(entityConfig)) {
      return isPathDynamicTrigger(entityConfig, propertyPath);
    }

    return false;
  }

  static isDataPath(path: string) {
    return path.endsWith(".data");
  }

  static detectReactiveDependencyMisuse(
    dependencyMap: DependencyMap,
    configTree: ConfigTree,
  ) {
    const dependencies = dependencyMap.rawDependencies;

    // Helper function to get all transitive dependencies
    const getAllTransitiveDependencies = (node: string): Set<string> => {
      const allDeps = new Set<string>();
      const queue = [node];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const deps = dependencyMap.getDirectDependencies(current) || [];

        for (const dep of deps) {
          if (!allDeps.has(dep)) {
            allDeps.add(dep);
            queue.push(dep);
          }
        }
      }

      return allDeps;
    };

    for (const [node, deps] of dependencies.entries()) {
      // Get all dependencies including transitive ones
      const allDeps = new Set<string>();
      const queue = Array.from(deps);

      while (queue.length > 0) {
        const dep = queue.shift()!;

        if (!allDeps.has(dep)) {
          allDeps.add(dep);
          const depDeps = dependencyMap.getDirectDependencies(dep) || [];

          queue.push(...depDeps);
        }
      }

      // Separate dependencies into trigger paths and data paths
      const triggerPaths = Array.from(deps).filter((dep) =>
        this.isTriggerPath(dep, configTree),
      );
      const dataPaths = Array.from(deps).filter((dep) => this.isDataPath(dep));

      // For each trigger path, check if there's a data path from the same entity
      for (const triggerPath of triggerPaths) {
        const triggerEntity = triggerPath.split(".")[0];

        // Find data paths from the same entity
        const sameEntityDataPaths = dataPaths.filter((dataPath) => {
          const dataEntity = dataPath.split(".")[0];

          return dataEntity === triggerEntity;
        });

        if (sameEntityDataPaths.length > 0) {
          // Check if any of these data paths depend on the trigger path (directly or indirectly)
          for (const dataPath of sameEntityDataPaths) {
            const dataPathTransitiveDeps =
              getAllTransitiveDependencies(dataPath);

            if (dataPathTransitiveDeps.has(triggerPath)) {
              const error = new Error(
                `Reactive dependency misuse: '${node}' depends on both trigger path '${triggerPath}' and data path '${dataPath}' from the same entity, and '${dataPath}' depends on '${triggerPath}' (directly or indirectly). This can cause unexpected reactivity.`,
              );

              // Add custom properties
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (error as any).node = node;

              throw error;
            }
          }
        }
      }
    }
  }
}

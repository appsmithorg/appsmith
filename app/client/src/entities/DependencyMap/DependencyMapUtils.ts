import toposort from "toposort";
import type DependencyMap from ".";
import { IMMEDIATE_PARENT_REGEX } from "@appsmith/workers/Evaluation/evaluationUtils";
import { union } from "lodash";

type SortDependencies =
  | {
      success: true;
      sortedDependencies: string[];
    }
  | { success: false; cyclicNode: string; error: unknown };

export class DependencyMapUtils {
  // inspired by https://www.npmjs.com/package/toposort#sorting-dependencies
  static sortDependencies(
    dependencies: Record<string, string[]>,
  ): SortDependencies {
    const dependencyTree: Array<[string, string | undefined]> = [];
    Object.entries(dependencies).forEach(([node, deps]) => {
      if (deps.length) {
        deps.forEach((dep) => dependencyTree.push([node, dep]));
      } else {
        // Set no dependency
        dependencyTree.push([node, undefined]);
      }
    });

    try {
      const sortedDependencies = toposort(dependencyTree)
        .reverse()
        .filter((edge) => !!edge);
      return { success: true, sortedDependencies };
    } catch (error) {
      // Cyclic dependency found. Extract node
      const cyclicNodes = (error as Error).message.match(
        new RegExp('Cyclic dependency, node was:"(.*)"'),
      );
      const node = cyclicNodes ? cyclicNodes[1] : "";
      return { success: false, cyclicNode: node, error };
    }
  }

  static makeParentsDependOnChildren(dependencyMap: DependencyMap) {
    const dependencies = dependencyMap.dependencies;
    Object.entries(dependencies).forEach(([node, deps]) => {
      this.makeParentsDependOnChild(dependencyMap, node);
      deps.forEach((dep) => {
        this.makeParentsDependOnChild(dependencyMap, dep);
      });
    });
    return dependencyMap;
  }

  private static makeParentsDependOnChild = (
    dependencyMap: DependencyMap,
    child: string,
  ) => {
    let curKey = child;
    let matches: string[] | null;

    while ((matches = curKey.match(IMMEDIATE_PARENT_REGEX)) !== null) {
      const immediateParent = matches[1];
      const existingImmediateParentDeps =
        dependencyMap.getDirectDependencies(immediateParent);
      const newDeps = union(existingImmediateParentDeps, curKey);
      dependencyMap.addDependency(immediateParent, newDeps);
      curKey = immediateParent;
    }
  };
}

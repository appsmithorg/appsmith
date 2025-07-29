import toposort from "toposort";
import type DependencyMap from ".";
import {
  entityTypeCheckForPathDynamicTrigger,
  getEntityNameAndPropertyPath,
  IMMEDIATE_PARENT_REGEX,
  isActionConfig,
  isDataPath,
  isJSActionConfig,
  isWidget,
} from "ee/workers/Evaluation/evaluationUtils";
import type { ConfigTree } from "entities/DataTree/dataTreeTypes";
import { isPathDynamicTrigger } from "utils/DynamicBindingUtils";
import { WorkerEnv } from "workers/Evaluation/handlers/workerEnv";
import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";

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
    const featureFlags = WorkerEnv.getFeatureFlags();
    const isReactiveActionsEnabled =
      featureFlags.release_reactive_actions_enabled;

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

      if (configTree && isReactiveActionsEnabled) {
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

    // We don't want to process the same node multiple times
    // STEP 1: Collect all unique nodes that need processing
    const nodesToProcess = new Set<string>();

    for (const [node, deps] of dependencies.entries()) {
      if (affectedSet.has(node)) {
        nodesToProcess.add(node); // Just add to set, don't call function yet
      }

      for (const dep of deps) {
        if (affectedSet.has(dep)) {
          nodesToProcess.add(dep); // Just add to set, don't call function yet
        }
      }
    }

    // STEP 2: Process each unique node exactly once
    for (const nodeToProcess of nodesToProcess) {
      DependencyMapUtils.makeParentsDependOnChild(dependencyMap, nodeToProcess);
    }
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

  static detectReactiveDependencyMisuse(
    dependencyMap: DependencyMap,
    configTree: ConfigTree,
  ) {
    const dependencies = dependencyMap.rawDependencies;

    for (const node of dependencies.keys()) {
      const { entityName: nodeName } = getEntityNameAndPropertyPath(node);
      const nodeConfig = configTree[nodeName];

      const isJSActionEntity = isJSActionConfig(nodeConfig);
      const isActionEntity = isActionConfig(nodeConfig);

      if (isJSActionEntity) {
        // Only continue if at least one function is automatic
        const hasAutomaticFunc = Object.values(nodeConfig.meta).some(
          (jsFunction) =>
            jsFunction.runBehaviour === ActionRunBehaviour.AUTOMATIC,
        );

        if (!hasAutomaticFunc) continue;
      } else if (isActionEntity) {
        // Only continue if runBehaviour is AUTOMATIC
        if (nodeConfig.runBehaviour !== ActionRunBehaviour.AUTOMATIC) continue;
      } else {
        // If not a JSAction, or Action, skip
        continue;
      }

      // For each entity, check if both .run and a .data path are present
      let hasRun = false;
      let hasData = false;
      let dataPath = "";
      let runPath = "";

      const transitiveDeps = this.getAllTransitiveDependencies(
        dependencyMap,
        node,
        configTree,
      );

      for (const dep of transitiveDeps) {
        const { entityName: depName } = getEntityNameAndPropertyPath(dep);
        const entity = configTree[depName];

        // to show cyclic dependency errors only for Action calls and not JSObject.body or JSObject
        if (entity && entity.ENTITY_TYPE) {
          if (this.isTriggerPath(dep, configTree)) {
            hasRun = true;
            runPath = dep;
          }

          // using the isDataPath function from evalUtils to calculate data paths based on entity type
          if (isDataPath(entity, dep)) {
            hasData = true;
            dataPath = dep;
          }

          if (
            hasRun &&
            hasData &&
            runPath.split(".")[0] === dataPath.split(".")[0]
          ) {
            throw Object.assign(
              new Error(
                `Reactive dependency misuse: '${node}' depends on both trigger path '${runPath}' and data path '${dataPath}' from the same entity. This can cause unexpected reactivity.`,
              ),
              { node, triggerPath: runPath, dataPath },
            );
          }
        }
      }
    }
  }

  /**
   * Returns all transitive dependencies (direct and indirect, no duplicates) for a given node.
   */
  static getAllTransitiveDependencies(
    dependencyMap: DependencyMap,
    node: string,
    configTree: ConfigTree,
  ): string[] {
    const dependencies = dependencyMap.rawDependencies;
    const visited = new Set<string>();

    function traverse(current: string) {
      const { entityName } = getEntityNameAndPropertyPath(current);
      const entityConfig = configTree[entityName];

      if (!entityConfig) return;

      if (isWidget(entityConfig)) {
        return;
      }

      // to not calculate transitive dependencies for JSObject.body and JSObject
      if (
        isJSActionConfig(entityConfig) &&
        (current.includes(".body") || !current.includes("."))
      ) {
        return;
      }

      const directDeps = dependencies.get(current) || new Set<string>();

      for (const dep of directDeps) {
        if (!visited.has(dep)) {
          visited.add(dep);
          traverse(dep);
        }
      }
    }

    traverse(node);

    return Array.from(visited);
  }
}

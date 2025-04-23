import { difference } from "lodash";
import { isChildPropertyPath } from "utils/DynamicBindingUtils";
import { sort } from "fast-sort";

export type TDependencies = Map<string, Set<string>>;
export default class DependencyMap {
  #nodes: Map<string, true>;
  #dependencies: TDependencies;
  #dependenciesInverse: TDependencies;
  #invalidDependencies: TDependencies;
  #invalidDependenciesInverse: TDependencies;

  constructor() {
    this.#nodes = new Map();
    this.#dependencies = new Map();
    this.#invalidDependencies = new Map();
    this.#dependenciesInverse = new Map();
    this.#invalidDependenciesInverse = new Map();
  }

  // Returns all nodes in the graph
  get nodes() {
    return Object.fromEntries(this.#nodes);
  }

  // Returns all edges in the graph
  get dependencies() {
    const deps: Record<string, string[]> = {};

    for (const [key, value] of this.#dependencies.entries()) {
      deps[key] = Array.from(value);
    }

    return deps;
  }

  get inverseDependencies() {
    const deps: Record<string, string[]> = {};

    for (const [key, value] of this.#dependenciesInverse.entries()) {
      deps[key] = Array.from(value);
    }

    return deps;
  }

  get invalidDependencies() {
    const deps: Record<string, string[]> = {};

    for (const [key, value] of this.#invalidDependencies.entries()) {
      deps[key] = Array.from(value);
    }

    return deps;
  }

  get inverseInvalidDependencies() {
    const deps: Record<string, string[]> = {};

    for (const [key, value] of this.#invalidDependenciesInverse.entries()) {
      deps[key] = Array.from(value);
    }

    return deps;
  }

  /**
   * Adds new dependencies to the graph.
   * Iterates over the dependencies and adds them to the graph if they it is a valid node.
   * If the dependency is not a valid node, it is added to the invalid dependencies and inverse invalid dependency.
   * @param node
   * @param dependencies
   */
  public addDependency = (node: string, dependencies: string[]) => {
    // Only add dependencies for nodes present in the graph
    if (!this.#nodes.has(node)) return;

    const validDependencies = new Set<string>();
    const invalidDependencies = new Set<string>();

    // Update the validDependencies and invalidDependencies
    // Valid dependencies are dependencies present in this.#node, otherwise, they are invalid.
    for (const dependency of dependencies) {
      if (this.#nodes.has(dependency)) {
        validDependencies.add(dependency);

        if (this.#dependenciesInverse.has(dependency)) {
          this.#dependenciesInverse.get(dependency)?.add(node);
        } else {
          this.#dependenciesInverse.set(dependency, new Set([node]));
        }
      } else {
        invalidDependencies.add(dependency);

        if (this.#invalidDependenciesInverse.has(dependency)) {
          this.#invalidDependenciesInverse.get(dependency)?.add(node);
        } else {
          this.#invalidDependenciesInverse.set(dependency, new Set([node]));
        }
      }
    }

    // Now that we have created a new set of dependencies, and invalid dependencies for the node,
    // we need to remove the node from the inverse-dependencies of previous invalidDeps and validDeps, which have been removed.

    const previousNodeDependencies =
      this.#dependencies.get(node) || new Set<string>();
    const newNodeDependencies = validDependencies;

    // dependencies removed from path
    const removedNodeDependencies = difference(
      Array.from(previousNodeDependencies),
      Array.from(newNodeDependencies),
    );

    // Remove node from the inverseDependencies of removed deps
    for (const removedDependency of removedNodeDependencies) {
      this.#dependenciesInverse.get(removedDependency)?.delete(node);
    }

    const previousNodeInvalidDependencies =
      this.#invalidDependencies.get(node) || new Set<string>();
    const newNodeInvalidDependencies = invalidDependencies;

    // invalid dependencies removed from path
    const removedNodeInvalidDependencies = difference(
      Array.from(previousNodeInvalidDependencies),
      Array.from(newNodeInvalidDependencies),
    );

    // Remove node from the inverseDependencies of removed invalidDeps
    for (const removedInvalidDependency of removedNodeInvalidDependencies) {
      this.#invalidDependenciesInverse
        .get(removedInvalidDependency)
        ?.delete(node);
    }

    // Now set the new deps and invalidDeps
    this.#dependencies.set(node, validDependencies);
    this.#invalidDependencies.set(node, invalidDependencies);
  };

  private removeDependency = (node: string) => {
    let didUpdateDependencies = false;
    const directDependenciesOfNode = this.getDirectDependencies(node);

    for (const directDependency of directDependenciesOfNode) {
      this.#dependenciesInverse.get(directDependency)?.delete(node);
      didUpdateDependencies = true;
    }

    const nodeExistedInDependencies = this.#dependencies.delete(node);

    if (nodeExistedInDependencies) {
      didUpdateDependencies = true;
    }

    this.#invalidDependencies.delete(node);

    return didUpdateDependencies;
  };

  /**
   * Adds new nodes to the graph. Should be called when a new node is added to the graph.
   * Iterates over the nodes and checks in the invalid dependency map, to see if it was used earlier.
   * If it was used earlier, it is added to the valid dependencies and removed from the invalid dependencies.
   * @param nodes
   */

  addNodes = (nodes: Record<string, true>, strict = true) => {
    const nodesToAdd = strict
      ? Object.keys(nodes)
      : sort(Object.keys(nodes)).desc((node) => node.split(".").length);

    let didUpdateGraph = false;

    for (const newNode of nodesToAdd) {
      if (this.#nodes.has(newNode)) continue;

      // New node introduced to the graph.
      this.#nodes.set(newNode, true);
      // Check the paths that consumed this node before it was introduced.
      const nodesThatAlreadyDependedOnThis =
        this.#invalidDependenciesInverse.get(newNode) || new Set<string>();

      if (!strict) {
        // In non-strict mode, when the newly added path is a parent of an invalid node,
        // all paths depending on the invalid node should be added as paths depending on new path
        // Example => if Button1.text depends on Api1.data.invalidNode(which doesn't exist), if Api1.data is newly added,
        // then Button1.text should be added to paths that depend on Api1.data

        for (const [invalidNode, dependants] of this
          .#invalidDependenciesInverse) {
          if (
            !nodes.hasOwnProperty(invalidNode) &&
            isChildPropertyPath(newNode, invalidNode, true)
          ) {
            dependants.forEach((dependant) => {
              nodesThatAlreadyDependedOnThis.add(dependant);
              this.#invalidDependencies.get(dependant)?.delete(invalidNode);
            });
            this.#invalidDependenciesInverse.delete(invalidNode);
          }
        }
      }

      for (const iNode of nodesThatAlreadyDependedOnThis) {
        // since the invalid node is now valid, add it to the valid dependencies.
        this.#dependencies.get(iNode)?.add(newNode);
        this.#invalidDependencies.get(iNode)?.delete(newNode);
        didUpdateGraph = true;

        if (this.#dependenciesInverse.has(newNode)) {
          this.#dependenciesInverse.get(newNode)?.add(iNode);
        } else {
          this.#dependenciesInverse.set(newNode, new Set([iNode]));
        }
      }

      this.#invalidDependenciesInverse.delete(newNode);
    }

    return didUpdateGraph;
  };

  removeNodes = (nodes: Record<string, true>) => {
    let didUpdateDependencies = false;

    for (const node of Object.keys(nodes)) {
      if (!this.#nodes.has(node)) continue;

      // Remove node from the graph.
      this.#nodes.delete(node);
      // Check the paths that consumed this node before it was removed.
      const nodesThatAlreadyDependedOnThis =
        this.#dependenciesInverse.get(node) || [];

      for (const iNode of nodesThatAlreadyDependedOnThis) {
        // since the valid node is now invalid, add it to the invalid dependencies.
        this.#invalidDependencies.get(iNode)?.add(node);
        this.#dependencies.get(iNode)?.delete(node);
        didUpdateDependencies = true;

        if (!this.#nodes.has(iNode)) continue;

        if (this.#invalidDependenciesInverse.has(node)) {
          this.#invalidDependenciesInverse.get(node)?.add(iNode);
        } else {
          this.#invalidDependenciesInverse.set(node, new Set([iNode]));
        }
      }

      this.#dependenciesInverse.delete(node);
      const nodeExistedInDependencies = this.removeDependency(node);

      if (nodeExistedInDependencies) didUpdateDependencies = true;
    }

    return didUpdateDependencies;
  };

  isRelated = (source: string, targets: string[]) => {
    if (targets.includes(source)) return true;

    const visited = new Set();
    const queue = [source];

    while (queue.length) {
      const node = queue.shift() as string;

      if (visited.has(node)) continue;

      visited.add(node);

      if (targets.includes(node)) return true;

      const nodes = this.#dependencies.get(node) || [];

      for (const n of nodes) {
        queue.push(n);
      }
    }

    return false;
  };

  getDependents(node: string) {
    const nodes = this.#dependenciesInverse.get(node);

    return Array.from(nodes || []);
  }
  getDirectDependencies(node: string) {
    const nodes = this.#dependencies.get(node);

    return Array.from(nodes || []);
  }

  getAllReachableNodes(source: string, targets: string[]) {
    const reachableNodes: string[] = [];

    if (targets.includes(source)) reachableNodes.push(source);

    const visited = new Set();
    const queue = [source];

    while (queue.length) {
      const node = queue.shift() as string;

      if (visited.has(node)) continue;

      visited.add(node);

      if (targets.includes(node)) reachableNodes.push(node);

      const nodes = this.#dependencies.get(node) || [];

      for (const n of nodes) {
        queue.push(n);
      }
    }

    return reachableNodes;
  }
  get rawDependencies() {
    return this.#dependencies;
  }
}

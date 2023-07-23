import { some } from "lodash";
import { isChildPropertyPath } from "utils/DynamicBindingUtils";

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

  get nodes() {
    return Object.fromEntries(this.#nodes);
  }

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
    const validDependencies = new Set<string>();
    const invalidDependencies = new Set<string>();

    const currentNodeDependencies =
      this.#dependencies.get(node) || new Set<string>();

    this.#invalidDependencies.get(node)?.forEach((invalidDep) => {
      this.#invalidDependenciesInverse.get(invalidDep)?.delete(node);
    });

    for (const currentDependency of currentNodeDependencies) {
      if (!dependencies.includes(currentDependency)) {
        this.#dependenciesInverse.get(currentDependency)?.delete(node);
      }
    }

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
    this.#dependencies.set(node, validDependencies);
    this.#invalidDependencies.set(node, invalidDependencies);
  };

  private removeDependency = (node: string) => {
    const nodeExistedInDependencies = this.#dependencies.delete(node);
    this.#invalidDependencies.delete(node);
    return nodeExistedInDependencies;
  };

  /**
   * Adds new nodes to the graph. Should be called when a new node is added to the graph.
   * Iterates over the nodes and checks in the invalid dependency map, to see if it was used earlier.
   * If it was used earlier, it is added to the valid dependencies and removed from the invalid dependencies.
   * @param nodes
   */

  addNodes = (nodes: Record<string, true>, strict = true) => {
    const nodesToAdd = Object.keys(nodes);
    let didUpdateGraph = false;
    for (const newNode of nodesToAdd) {
      if (this.#nodes.has(newNode)) continue;
      // New node introduced to the graph.
      this.#nodes.set(newNode, true);
      // Check the paths that consumed this node before it was introduced.
      const nodesThatAlreadyDependedOnThis =
        this.#invalidDependenciesInverse.get(newNode) || new Set<string>();
      if (!strict) {
        for (const [invalidNode, dependants] of this
          .#invalidDependenciesInverse) {
          if (
            !nodesToAdd.includes(invalidNode) &&
            isChildPropertyPath(newNode, invalidNode, true) &&
            !some(
              nodesToAdd,
              (node) =>
                isChildPropertyPath(newNode, node, true) &&
                isChildPropertyPath(node, invalidNode, true),
            )
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
    const keys = Object.keys(nodes);
    for (const node of keys) {
      if (!this.#nodes.has(node)) continue;
      // Node removed from the graph.
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
}

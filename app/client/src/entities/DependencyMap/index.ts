import { convertPathToString } from "ce/workers/Evaluation/evaluationUtils";
import { toPath } from "lodash";

export default class DependencyMap {
  #nodes: Map<string, true>;
  #dependencies: Map<string, Set<string>>;
  #dependenciesInverse: Map<string, Set<string>>;
  #invalidDependencies: Map<string, Set<string>>;
  #invalidDependenciesInverse: Map<string, Set<string>>;

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
    for (let dependency of dependencies) {
      const { isValid, reference } = getReference(dependency, this.#nodes);
      dependency = reference;
      if (isValid) {
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
    this.#dependencies.delete(node);
    this.#invalidDependencies.delete(node);
  };

  /**
   * Adds new nodes to the graph. Should be called when a new node is added to the graph.
   * Iterates over the nodes and checks in the invalid dependency map, to see if it was used earlier.
   * If it was used earlier, it is added to the valid dependencies and removed from the invalid dependencies.
   * @param nodes
   */
  addNodes = (nodes: Record<string, true>) => {
    const keys = Object.keys(nodes);
    for (const node of keys) {
      if (this.#nodes.has(node)) continue;
      // New node introduced to the graph.
      this.#nodes.set(node, true);
      // Check the paths that consumed this node before it was introduced.
      const nodesThatAlreadyDependedOnThis =
        this.#invalidDependenciesInverse.get(node) || [];
      for (const iNode of nodesThatAlreadyDependedOnThis) {
        // since the invalid node is now valid, add it to the valid dependencies.
        this.#dependencies.get(iNode)?.add(node);
        this.#invalidDependencies.get(iNode)?.delete(node);
        if (this.#dependenciesInverse.has(node)) {
          this.#dependenciesInverse.get(node)?.add(iNode);
        } else {
          this.#dependenciesInverse.set(node, new Set([iNode]));
        }
      }
      this.#invalidDependenciesInverse.delete(node);
    }
  };

  removeNodes = (nodes: Record<string, true>) => {
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
        if (!this.#nodes.has(iNode)) continue;
        if (this.#invalidDependenciesInverse.has(node)) {
          this.#invalidDependenciesInverse.get(node)?.add(iNode);
        } else {
          this.#invalidDependenciesInverse.set(node, new Set([iNode]));
        }
      }
      this.#dependenciesInverse.delete(node);
      this.removeDependency(node);
    }
  };

  isRelated = (source: string, target: string) => {
    if (source === target) return true;
    const visited = new Set();
    const queue = [source];
    while (queue.length) {
      const node = queue.shift() as string;
      if (visited.has(node)) continue;
      visited.add(node);
      if (node === target) return true;
      const nodes = this.#dependencies.get(node) || [];
      for (const n of nodes) {
        queue.push(n);
      }
    }
    return false;
  };
}

function getReference(
  reference: string,
  nodes: Map<string, true>,
): {
  isValid: boolean;
  reference: string;
} {
  if (nodes.has(reference)) {
    return { isValid: true, reference };
  }
  const subpaths = toPath(reference);
  let currentString = "";
  // We want to keep going till we reach top level, but not add top level
  // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
  // This is mainly to avoid a lot of unnecessary dependency.
  while (subpaths.length > 1) {
    currentString = convertPathToString(subpaths);
    // We've found the dep, add it and return
    if (nodes.has(currentString)) {
      return { isValid: true, reference: currentString };
    }
    subpaths.pop();
  }
  // If no valid reference is derived, return invalidReference
  return { isValid: false, reference };
}

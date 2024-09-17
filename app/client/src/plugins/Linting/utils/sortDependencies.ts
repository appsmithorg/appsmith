import type { TDependencies } from "entities/DependencyMap";
import toposort from "toposort";

export function sortDependencies(dependencyMap: TDependencies): Array<string> {
  // https://github.com/marcelklehr/toposort#sorting-dependencies
  const edges: Array<[string, string | undefined]> = [];

  dependencyMap.forEach((dependencies, path) => {
    if (!dependencies.size) {
      edges.push([path, undefined]);
    } else {
      dependencies.forEach((dependency) => edges.push([path, dependency]));
    }
  });

  try {
    return toposort<string>(edges).reverse();
  } catch (error) {
    return [];
  }
}

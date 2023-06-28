import { mergeWith, union } from "lodash";
import type { DependencyMap } from "utils/DynamicBindingUtils";

export function mergeMaps(firstMap: DependencyMap, secondMap: DependencyMap) {
  return mergeWith(
    firstMap,
    secondMap,
    (firstVal: string[], secondVal: string[]) => {
      return union(firstVal, secondVal);
    },
  );
}

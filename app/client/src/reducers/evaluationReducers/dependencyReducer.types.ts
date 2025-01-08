import type { DependencyMap } from "utils/DynamicBindingUtils";

export type { DependencyMap };
export interface EvaluationDependencyState {
  inverseDependencyMap: DependencyMap;
}

import type { AppState } from "@appsmith/reducers";

export const getCachedDependencyMap = (state: AppState) =>
  state.evaluations.dependencies.cachedDependencyMap;

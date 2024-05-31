import type { AppState } from "@appsmith/reducers";

export const getCachedDependencies = (state: AppState) =>
  state.evaluations.dependencies.cachedDependencies;

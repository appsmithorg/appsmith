import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { AppState } from "@appsmith/reducers";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import { createSelector } from "reselect";

export const getCachedDependencies = (state: AppState) =>
  state.evaluations.dependencies.cachedDependencies;

export const getIsDependencyCacheEnabled = createSelector(
  (state: AppState) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.release_dependency_caching_published_mode_enabled,
    ),
  getAppMode,
  (isDependencyCacheFeatureFlagEnabled, appMode) => {
    return isDependencyCacheFeatureFlagEnabled && appMode === "PUBLISHED";
  },
);

import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import { APP_MODE } from "entities/App";
import { createSelector } from "reselect";

export const getCachedDependencyMap = createSelector(
  getAppMode,
  (state) => state.evaluations.dependencies.cachedDependencyMap,
  (appMode, cachedDependencyMap) => {
    if (appMode === APP_MODE.PUBLISHED) {
      return cachedDependencyMap;
    }
  },
);

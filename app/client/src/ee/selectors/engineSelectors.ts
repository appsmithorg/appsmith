export * from "ce/selectors/engineSelectors";
import { createSelector } from "reselect";
import { getShowQueryModule } from "./moduleFeatureSelectors";

export interface DependentFeatureFlags {
  showQueryModule?: boolean;
}

export const getFeatureFlagsForEngine = createSelector(
  getShowQueryModule,
  (showQueryModule) => {
    return {
      showQueryModule,
    };
  },
);

export * from "ce/selectors/engineSelectors";
import { createSelector } from "reselect";
import { getShowQueryModule } from "./moduleFeatureSelectors";
import { getShowWorkflowFeature } from "./workflowSelectors";

export interface DependentFeatureFlags {
  showQueryModule?: boolean;
  showWorkflowFeature?: boolean;
}

export const getFeatureFlagsForEngine = createSelector(
  getShowQueryModule,
  getShowWorkflowFeature,
  (showQueryModule, showWorkflowFeature) => {
    return {
      showQueryModule,
      showWorkflowFeature,
    };
  },
);

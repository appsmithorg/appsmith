import type { AppState } from "@appsmith/reducers";
import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";
import { createSelector } from "reselect";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

export const selectFeatureFlags = (state: AppState) =>
  state.ui.users.featureFlag.data;

export const selectFeatureFlagCheck = (
  state: AppState,
  flagName: FeatureFlag,
): boolean => {
  const flagValues = selectFeatureFlags(state);

  if (flagName in flagValues) {
    return flagValues[flagName];
  }
  return false;
};

export const getIsEditorPaneSegmentsEnabled = createSelector(
  selectFeatureFlags,
  (flags) => {
    const isEditorSegmentsReleaseEnabled =
      flags[FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled];

    const isEditorSegmentsRolloutEnabled =
      flags[FEATURE_FLAG.rollout_editor_pane_segments_enabled];

    return isEditorSegmentsReleaseEnabled || isEditorSegmentsRolloutEnabled;
  },
);

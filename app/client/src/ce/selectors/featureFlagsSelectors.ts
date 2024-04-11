import type { AppState } from "@appsmith/reducers";
import type {
  FeatureFlag,
  FeatureFlags,
  OverriddenFeatureFlags,
} from "@appsmith/entities/FeatureFlag";
import { createSelector } from "reselect";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import memoize from "micro-memoize";

const combineFeatureFlags = memoize(
  (featureFlags: FeatureFlags, overriddenFlags: OverriddenFeatureFlags) => {
    return { ...featureFlags, ...overriddenFlags };
  },
);

export const selectFeatureFlags = (state: AppState) => {
  return combineFeatureFlags(
    state.ui.users.featureFlag.data,
    state.ui.users.featureFlag.overriddenFlags,
  );
};

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

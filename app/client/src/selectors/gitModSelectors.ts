// temp file will be removed after git mod is fully rolled out

import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { createSelector } from "reselect";
import { getCurrentGitBranch, protectedModeSelector } from "./gitSyncSelectors";
import {
  selectGitCurrentBranch as selectGitCurrentBranchNew,
  selectGitProtectedMode as selectGitProtectedModeNew,
} from "git";
import {
  getCurrentBaseApplicationId,
  previewModeSelector,
} from "./editorSelectors";
import { applicationArtifact } from "git/artifact-helpers/application";

export const selectGitModEnabled = createSelector(
  selectFeatureFlags,
  // (featureFlags) => featureFlags.release_git_modularisation_enabled ?? false,
  () => true,
);

export const selectGitApplicationArtifactDef = createSelector(
  getCurrentBaseApplicationId,
  (baseApplicationId) => applicationArtifact(baseApplicationId),
);

export const selectGitApplicationCurrentBranch = createSelector(
  selectGitModEnabled,
  getCurrentGitBranch,
  (state) =>
    selectGitCurrentBranchNew(state, selectGitApplicationArtifactDef(state)),
  (isGitModEnabled, currentBranchOld, currentBranchNew) => {
    return isGitModEnabled ? currentBranchNew : currentBranchOld;
  },
);

export const selectGitApplicationProtectedMode = createSelector(
  selectGitModEnabled,
  protectedModeSelector,
  (state) =>
    selectGitProtectedModeNew(state, selectGitApplicationArtifactDef(state)),
  (isGitModEnabled, protectedModeOld, protectedModeNew) => {
    return isGitModEnabled ? protectedModeNew : protectedModeOld;
  },
);

export const selectCombinedPreviewMode = createSelector(
  previewModeSelector,
  selectGitApplicationProtectedMode,
  (isPreviewMode, isProtectedMode) => isPreviewMode || isProtectedMode,
);

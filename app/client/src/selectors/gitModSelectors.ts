// temp file will be removed after git mod is fully rolled out

import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { createSelector } from "reselect";
import { getCurrentGitBranch, protectedModeSelector } from "./gitSyncSelectors";
import type { AppState } from "ee/reducers";
import {
  selectGitCurrentBranch as selectGitCurrentBranchNew,
  selectGitProtectedMode as selectGitProtectedModeNew,
  type GitArtifactDef,
} from "git";
import { getCurrentBaseApplicationId } from "./editorSelectors";
import { applicationArtifact } from "git/artifact-helpers/application";

export const selectGitModEnabled = createSelector(
  selectFeatureFlags,
  (featureFlags) => featureFlags.release_git_modularisation_enabled ?? false,
);

export function selectGitCurrentBranch(
  state: AppState,
  artifactDef: GitArtifactDef,
) {
  const isGitModEnabled = selectGitModEnabled(state);

  if (isGitModEnabled) {
    return getCurrentGitBranch(state);
  } else {
    return selectGitCurrentBranchNew(state, artifactDef);
  }
}

export function selectGitProtectedMode(
  state: AppState,
  artifactDef: GitArtifactDef,
) {
  const isGitModEnabled = selectGitModEnabled(state);

  if (isGitModEnabled) {
    return protectedModeSelector(state);
  } else {
    return selectGitProtectedModeNew(state, artifactDef);
  }
}

export const selectCombinedPreviewMode = createSelector(
  protectedModeSelector,
  (state: AppState) => {
    const baseApplicationId = getCurrentBaseApplicationId(state);

    return selectGitProtectedMode(
      state,
      applicationArtifact(baseApplicationId),
    );
  },
  (isPreviewMode, isProtectedMode) => isPreviewMode || isProtectedMode,
);

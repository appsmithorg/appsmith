import { createSelector } from "reselect";
import {
  getCurrentGitBranch,
  getIsGitSyncModalOpen,
  protectedModeSelector,
} from "./gitSyncSelectors";
import {
  selectGitCurrentBranch as selectGitCurrentBranchNew,
  selectGitProtectedMode as selectGitProtectedModeNew,
  selectGitOpsModalOpen as selectGitOpsModalOpenNew,
  selectGitConnectModalOpen as selectGitConnectModalOpenNew,
} from "git/store/selectors";
import type { AppState } from "ee/reducers";
import { applicationArtifact } from "git-artifact-helpers/application";

export const selectGitModEnabled = createSelector(
  (state: AppState) => {
    return {
      ...state.ui.users.featureFlag.data,
      ...state.ui.users.featureFlag.overriddenFlags,
    };
  },
  (featureFlags) => featureFlags.release_git_modularisation_enabled ?? false,
);

export const selectGitApplicationArtifactDef = createSelector(
  (state: AppState) => state.entities.pageList.baseApplicationId || "",
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
  // need to do this to avoid circular dependency
  (state: AppState) => state.ui.editor.isPreviewMode,
  selectGitApplicationProtectedMode,
  (isPreviewMode, isProtectedMode) => isPreviewMode || isProtectedMode,
);

export const selectGitOpsModalOpen = createSelector(
  selectGitModEnabled,
  getIsGitSyncModalOpen,
  (state) =>
    selectGitOpsModalOpenNew(state, selectGitApplicationArtifactDef(state)),
  (isGitModEnabled, isOldModalOpen, isNewModalOpen) => {
    return isGitModEnabled ? isNewModalOpen : isOldModalOpen;
  },
);

export const selectGitConnectModalOpen = createSelector(
  selectGitModEnabled,
  getIsGitSyncModalOpen,
  (state) =>
    selectGitConnectModalOpenNew(state, selectGitApplicationArtifactDef(state)),
  (isGitModEnabled, isOldModalOpen, isNewModalOpen) => {
    return isGitModEnabled ? isNewModalOpen : isOldModalOpen;
  },
);

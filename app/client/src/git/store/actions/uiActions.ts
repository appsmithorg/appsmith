import type { GitOpsTab, GitSettingsTab } from "git/constants/enums";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

interface ToggleRepoLimitModalPayload {
  open: boolean;
}

export const toggleRepoLimitErrorModalAction =
  createSingleArtifactAction<ToggleRepoLimitModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.repoLimitErrorModal.open = open;

    return state;
  });

interface BranchListPopupPayload {
  open: boolean;
}

export const toggleBranchListPopupAction =
  createSingleArtifactAction<BranchListPopupPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.branchListPopup.open = open;

    return state;
  });

export interface ToggleGitOpsModalPayload {
  open: boolean;
  tab: keyof typeof GitOpsTab;
}

export const toggleGitOpsModalAction =
  createSingleArtifactAction<ToggleGitOpsModalPayload>((state, action) => {
    const { open, tab } = action.payload;

    state.ui.opsModal.open = open;
    state.ui.opsModal.tab = tab;

    return state;
  });

export interface ToggleGitSettingsModalPayload {
  open: boolean;
  tab: keyof typeof GitSettingsTab;
}

export const toggleGitSettingsModalAction =
  createSingleArtifactAction<ToggleGitSettingsModalPayload>((state, action) => {
    const { open, tab } = action.payload;

    state.ui.settingsModal.open = open;
    state.ui.settingsModal.tab = tab;

    return state;
  });

export interface ToggleGitConnectModalPayload {
  open: boolean;
}

export const toggleGitConnectModalAction =
  createSingleArtifactAction<ToggleGitConnectModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.connectModal.open = open;

    return state;
  });

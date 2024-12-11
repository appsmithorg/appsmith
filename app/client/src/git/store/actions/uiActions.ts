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

export interface ToggleOpsModalPayload {
  open: boolean;
  tab: keyof typeof GitOpsTab;
}

export const toggleOpsModalAction =
  createSingleArtifactAction<ToggleOpsModalPayload>((state, action) => {
    const { open, tab } = action.payload;

    state.ui.opsModalOpen = open;
    state.ui.opsModalTab = tab;

    return state;
  });

export interface ToggleSettingsModalPayload {
  open: boolean;
  tab: keyof typeof GitSettingsTab;
}

export const toggleSettingsModalAction =
  createSingleArtifactAction<ToggleSettingsModalPayload>((state, action) => {
    const { open, tab } = action.payload;

    state.ui.settingsModal.open = open;
    state.ui.settingsModal.tab = tab;

    return state;
  });

export interface ToggleConnectModalPayload {
  open: boolean;
}

export const toggleConnectModalAction =
  createSingleArtifactAction<ToggleConnectModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.connectModal.open = open;

    return state;
  });

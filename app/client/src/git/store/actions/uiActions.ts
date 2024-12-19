import type { GitOpsTab, GitSettingsTab } from "git/constants/enums";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

// connect modal
export interface ToggleConnectModalPayload {
  open: boolean;
}

export const toggleConnectModalAction =
  createSingleArtifactAction<ToggleConnectModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.connectModal.open = open;

    return state;
  });

// disconnect modal
export interface OpenDisconnectModalPayload {
  artifactName: string;
}

export const openDisconnectModalAction =
  createSingleArtifactAction<OpenDisconnectModalPayload>((state, action) => {
    state.ui.disconnectBaseArtifactId = action.payload.baseArtifactId;
    state.ui.disconnectArtifactName = action.payload.artifactName;

    return state;
  });

export const closeDisconnectModalAction = createSingleArtifactAction(
  (state) => {
    state.ui.disconnectBaseArtifactId = null;
    state.ui.disconnectArtifactName = null;

    return state;
  },
);

// ops modal

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

// settings modal
export interface ToggleSettingsModalPayload {
  open: boolean;
  tab: keyof typeof GitSettingsTab;
}

export const toggleSettingsModalAction =
  createSingleArtifactAction<ToggleSettingsModalPayload>((state, action) => {
    const { open, tab } = action.payload;

    state.ui.settingsModalOpen = open;
    state.ui.settingsModalTab = tab;

    return state;
  });

// autocommit modal
interface ToggleAutocommitDisableModalPayload {
  open: boolean;
}

export const toggleAutocommitDisableModalAction =
  createSingleArtifactAction<ToggleAutocommitDisableModalPayload>(
    (state, action) => {
      const { open } = action.payload;

      state.ui.autocommitDisableModalOpen = open;

      return state;
    },
  );

// branch popup
interface BranchListPopupPayload {
  open: boolean;
}

export const toggleBranchListPopupAction =
  createSingleArtifactAction<BranchListPopupPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.branchListPopup.open = open;

    return state;
  });

// error modals
interface ToggleRepoLimitModalPayload {
  open: boolean;
}

export const toggleRepoLimitErrorModalAction =
  createSingleArtifactAction<ToggleRepoLimitModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.repoLimitErrorModal.open = open;

    return state;
  });

interface ToggleConflictErrorModalPayload {
  open: boolean;
}

export const toggleConflictErrorModalAction =
  createSingleArtifactAction<ToggleConflictErrorModalPayload>(
    (state, action) => {
      const { open } = action.payload;

      state.ui.conflictErrorModalOpen = open;

      return state;
    },
  );

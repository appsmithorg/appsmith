import type { GitOpsTab, GitSettingsTab } from "git/constants/enums";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitArtifactDef, GitGlobalReduxState } from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

// connect modal
export interface ToggleConnectModalPayload {
  open: boolean;
}

export const toggleConnectModalAction =
  createArtifactAction<ToggleConnectModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.connectModalOpen = open;

    return state;
  });

export interface ToggleConnectSuccessModalPayload {
  open: boolean;
}

export const toggleConnectSuccessModalAction =
  createArtifactAction<ToggleConnectSuccessModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.connectSuccessModalOpen = open;

    return state;
  });

export interface ToggleImportModalPayload {
  open: boolean;
}

export const toggleImportModalAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<ToggleImportModalPayload>,
) => {
  const { open } = action.payload;

  state.isImportModalOpen = open;

  return state;
};

// disconnect modal
export interface OpenDisconnectModalPayload {
  targetArtifactDef: GitArtifactDef;
  targetArtifactName: string;
}

export const openDisconnectModalAction =
  createArtifactAction<OpenDisconnectModalPayload>((state, action) => {
    state.ui.disconnectBaseArtifactId =
      action.payload.targetArtifactDef.baseArtifactId;
    state.ui.disconnectArtifactType =
      action.payload.targetArtifactDef.artifactType;
    state.ui.disconnectArtifactName = action.payload.targetArtifactName;

    return state;
  });

export const closeDisconnectModalAction = createArtifactAction((state) => {
  state.ui.disconnectBaseArtifactId = null;
  state.ui.disconnectArtifactType = null;
  state.ui.disconnectArtifactName = null;

  return state;
});

// ops modal

export interface ToggleOpsModalPayload {
  open: boolean;
  tab: keyof typeof GitOpsTab;
}

export const toggleOpsModalAction = createArtifactAction<ToggleOpsModalPayload>(
  (state, action) => {
    const { open, tab } = action.payload;

    state.ui.opsModalOpen = open;
    state.ui.opsModalTab = tab;

    return state;
  },
);

// settings modal
export interface ToggleSettingsModalPayload {
  open: boolean;
  tab: keyof typeof GitSettingsTab;
}

export const toggleSettingsModalAction =
  createArtifactAction<ToggleSettingsModalPayload>((state, action) => {
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
  createArtifactAction<ToggleAutocommitDisableModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.autocommitDisableModalOpen = open;

    return state;
  });

// branch popup
interface BranchPopupPayload {
  open: boolean;
}

export const toggleBranchPopupAction = createArtifactAction<BranchPopupPayload>(
  (state, action) => {
    const { open } = action.payload;

    state.ui.branchPopupOpen = open;

    return state;
  },
);

// error modals
interface ToggleConflictErrorModalPayload {
  open: boolean;
}

export const toggleConflictErrorModalAction =
  createArtifactAction<ToggleConflictErrorModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.conflictErrorModalOpen = open;

    return state;
  });

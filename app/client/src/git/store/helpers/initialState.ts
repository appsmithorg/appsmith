import {
  gitArtifactAPIResponsesInitialState as gitArtifactAPIResponsesInitialStateExtended,
  gitArtifactUIInitialState as gitArtifactUIInitialStateExtended,
} from "git/ee/store/helpers/initialState";
import { GitOpsTab, GitSettingsTab } from "../../constants/enums";
import type {
  GitArtifactAPIResponsesReduxState,
  GitArtifactUIReduxState,
  GitArtifactReduxState,
  GitGlobalReduxState,
} from "../types";

const gitArtifactInitialUIState: GitArtifactUIReduxState = {
  initializing: false,
  initialized: false,
  currentBranch: null,
  connectModalOpen: false,
  connectSuccessModalOpen: false,
  disconnectBaseArtifactId: null,
  disconnectArtifactType: null,
  disconnectArtifactName: null,
  branchPopupOpen: false,
  checkoutDestBranch: null,
  opsModalOpen: false,
  opsModalTab: GitOpsTab.Deploy,
  mergeSuccess: false,
  settingsModalOpen: false,
  settingsModalTab: GitSettingsTab.General,
  autocommitDisableModalOpen: false,
  autocommitPolling: false,
  conflictErrorModalOpen: false,
  // EE
  ...gitArtifactUIInitialStateExtended,
};

const gitArtifactInitialAPIResponses: GitArtifactAPIResponsesReduxState = {
  metadata: {
    value: null,
    loading: false,
    error: null,
  },
  connect: {
    loading: false,
    error: null,
  },
  status: {
    value: null,
    loading: false,
    error: null,
  },
  commit: {
    loading: false,
    error: null,
  },
  pull: {
    loading: false,
    error: null,
  },
  discard: {
    loading: false,
    error: null,
  },
  mergeStatus: {
    value: null,
    loading: false,
    error: null,
  },
  merge: {
    loading: false,
    error: null,
  },
  branches: {
    value: null,
    loading: false,
    error: null,
  },
  checkoutBranch: {
    loading: false,
    error: null,
  },
  createBranch: {
    loading: false,
    error: null,
  },
  deleteBranch: {
    loading: false,
    error: null,
  },
  localProfile: {
    value: null,
    loading: false,
    error: null,
  },
  updateLocalProfile: {
    loading: false,
    error: null,
  },
  disconnect: {
    loading: false,
    error: null,
  },
  protectedBranches: {
    value: null,
    loading: false,
    error: null,
  },
  updateProtectedBranches: {
    loading: false,
    error: null,
  },
  autocommitProgress: {
    loading: false,
    error: null,
  },
  toggleAutocommit: {
    loading: false,
    error: null,
  },
  triggerAutocommit: {
    loading: false,
    error: null,
  },
  generateSSHKey: {
    loading: false,
    error: null,
  },
  sshKey: {
    value: null,
    loading: false,
    error: null,
  },
  pretag: {
    value: null,
    loading: false,
    error: null,
  },
  createReleaseTag: {
    loading: false,
    error: null,
  },

  // EE
  ...gitArtifactAPIResponsesInitialStateExtended,
};

export const gitArtifactInitialState: GitArtifactReduxState = {
  ui: gitArtifactInitialUIState,
  apiResponses: gitArtifactInitialAPIResponses,
};

export const gitGlobalInitialState: GitGlobalReduxState = {
  globalProfile: {
    value: null,
    loading: false,
    error: null,
  },
  updateGlobalProfile: {
    loading: false,
    error: null,
  },
  globalSSHKey: {
    value: null,
    loading: false,
    error: null,
  },
  gitImport: {
    loading: false,
    error: null,
  },
  isImportModalOpen: false,
  repoLimitErrorModalOpen: false,
};

import {
  GitConnectStep,
  GitImportStep,
  GitOpsTab,
  GitSettingsTab,
} from "../../enums";
import type {
  GitSingleArtifactAPIResponsesReduxState,
  GitSingleArtifactUIReduxState,
  GitSingleArtifactReduxState,
} from "../../types";

const gitSingleArtifactInitialUIState: GitSingleArtifactUIReduxState = {
  connectModal: {
    open: false,
    step: GitConnectStep.provider,
  },
  importModal: {
    open: false,
    step: GitImportStep.provider,
  },
  branchList: {
    open: false,
  },
  opsModal: {
    open: false,
    tab: GitOpsTab.deploy,
  },
  settingsModal: {
    open: false,
    tab: GitSettingsTab.general,
  },
};

const gitSingleArtifactInitialAPIResponses: GitSingleArtifactAPIResponsesReduxState =
  {
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
    globalConfig: {
      value: null,
      loading: false,
      error: null,
    },
    localConfig: {
      value: null,
      loading: false,
      error: null,
    },
    updateGlobalConfig: {
      loading: false,
      error: null,
    },
    updateLocalConfig: {
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
      value: null,
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
  };

export const gitSingleArtifactInitialState: GitSingleArtifactReduxState = {
  ui: gitSingleArtifactInitialUIState,
  apiResponses: gitSingleArtifactInitialAPIResponses,
};

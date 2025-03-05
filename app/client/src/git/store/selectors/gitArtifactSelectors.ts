import type { GitArtifactDef } from "git/types";
import type { GitRootState } from "git/store/types";

export const selectGitArtifact = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => {
  return state.git.artifacts[artifactDef.artifactType]?.[
    artifactDef.baseArtifactId
  ];
};

// init
export const selectInitializing = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui?.initializing ?? false;

export const selectInitialized = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui?.initialized ?? false;

// metadata
export const selectMetadataState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.metadata;

export const selectConnected = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => !!selectMetadataState(state, artifactDef)?.value;

// CONNECT
export const selectConnectState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.connect;

export const selectFetchSSHKeysState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.sshKey;

export const selectGenerateSSHKeyState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.generateSSHKey;

export const selectConnectModalOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.connectModalOpen;

export const selectConnectSuccessModalOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.connectSuccessModalOpen;

export const selectDisconnectState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.disconnect;

export const selectDisconnectArtifactDef = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => {
  const baseArtifactId = selectGitArtifact(state, artifactDef)?.ui
    .disconnectBaseArtifactId;
  const artifactType = selectGitArtifact(state, artifactDef)?.ui
    .disconnectArtifactType;

  if (!baseArtifactId || !artifactType) return null;

  return { baseArtifactId, artifactType };
};

export const selectDisconnectArtifactName = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.disconnectArtifactName;

// git ops
export const selectCommitState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.commit;

export const selectPretagState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.pretag;

export const selectDiscardState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.discard;

export const selectStatusState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.status;

export const selectMergeState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.merge;

export const selectMergeSuccess = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.mergeSuccess;

export const selectMergeStatusState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.mergeStatus;

export const selectPullState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.pull;

export const selectOpsModalOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.opsModalOpen;

export const selectOpsModalTab = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.opsModalTab;

export const selectConflictErrorModalOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.conflictErrorModalOpen;

// git branches

export const selectCurrentBranch = (
  state: GitRootState,
  // need this to preserve interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.currentBranch ?? null;

export const selectFetchBranchesState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.branches;

export const selectCreateBranchState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.createBranch;

export const selectDeleteBranchState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.deleteBranch;

export const selectCheckoutBranchState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.checkoutBranch;

export const selectCheckoutDestBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.checkoutDestBranch;

export const selectBranchPopupOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.branchPopupOpen;

// SETTINGS

// local profile
export const selectFetchLocalProfileState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.localProfile ?? null;

export const selectUpdateLocalProfileState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.updateLocalProfile;

// autocommit
export const selectToggleAutocommitState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.toggleAutocommit;

export const selectTriggerAutocommitState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.triggerAutocommit;

export const selectAutocommitDisableModalOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.autocommitDisableModalOpen;

export const selectAutocommitEnabled = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => {
  const gitMetadata = selectMetadataState(state, artifactDef).value;

  return gitMetadata?.autoCommitConfig?.enabled ?? false;
};

export const selectAutocommitPolling = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.autocommitPolling;

// default branch
export const selectDefaultBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectMetadataState(state, artifactDef)?.value?.defaultBranchName ?? null;

// protected branches
export const selectFetchProtectedBranchesState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.protectedBranches;

export const selectUpdateProtectedBranchesState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) =>
  selectGitArtifact(state, artifactDef)?.apiResponses.updateProtectedBranches;

export const selectProtectedMode = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => {
  const currentBranch = selectCurrentBranch(state, artifactDef);
  const protectedBranches =
    selectFetchProtectedBranchesState(state, artifactDef)?.value ?? [];

  return protectedBranches?.includes(currentBranch ?? "") ?? false;
};

// settings modal
export const selectSettingsModalOpen = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.settingsModalOpen;

export const selectSettingsModalTab = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.settingsModalTab;

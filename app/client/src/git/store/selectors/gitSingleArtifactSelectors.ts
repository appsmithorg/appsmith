import type { GitArtifactType } from "git/constants/enums";
import type { GitRootState } from "../types";

export interface GitArtifactDef {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export const selectGitArtifact = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => {
  return state.git.artifacts[artifactDef.artifactType]?.[
    artifactDef.baseArtifactId
  ];
};

// metadata
export const selectMetadataState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.metadata;

export const selectGitConnected = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => !!selectMetadataState(state, artifactDef)?.value;

// CONNECT
export const selectConnectState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.connect;

export const selectGitImportState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.gitImport;

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

export const selectDisconnectState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.disconnect;

export const selectDisconnectBaseArtifactId = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.disconnectBaseArtifactId;

export const selectDisconnectArtifactName = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.ui.disconnectArtifactName;

// git ops
export const selectCommitState = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.commit;

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
  artifactDef: GitArtifactDef,
) => {
  const gitMetadataState = selectMetadataState(state, artifactDef).value;

  return gitMetadataState?.branchName;
};

export const selectBranches = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.branches;

export const selectCreateBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.createBranch;

export const selectDeleteBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses?.deleteBranch;

export const selectCheckoutBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectGitArtifact(state, artifactDef)?.apiResponses.checkoutBranch;

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
  const protectedBranches = selectFetchProtectedBranchesState(
    state,
    artifactDef,
  ).value;

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

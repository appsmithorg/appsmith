import { AppState } from "reducers";

export const getIsGitSyncModalOpen = (state: AppState) =>
  state.ui.gitSync.isGitSyncModalOpen;

export const getIsGitRepoSetup = () => false;

export const getCurrentGitBranch = () => "master";

export const getIsCommittingInProgress = (state: AppState) =>
  state.ui.gitSync.isCommitting;

export const currentGitBranch = () => "master";

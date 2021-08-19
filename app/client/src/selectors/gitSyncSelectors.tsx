import { AppState } from "reducers";

export const getIsGitSyncModalOpen = (state: AppState) =>
  state.ui.gitSync.isGitSyncModalOpen;

export const getIsGitRepoSetup = () => false;

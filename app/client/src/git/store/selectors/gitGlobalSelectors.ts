import type { GitRootState } from "../types";

export const selectGitGlobal = (state: GitRootState) => {
  return state.git.global;
};

// global profile
export const selectFetchGlobalProfileState = (state: GitRootState) =>
  selectGitGlobal(state).globalProfile;

export const selectUpdateGlobalProfileState = (state: GitRootState) =>
  selectGitGlobal(state).updateGlobalProfile;

export const selectImportModalOpen = (state: GitRootState) =>
  selectGitGlobal(state).isImportModalOpen;

export const selectImportOverrideModalOpen = (state: GitRootState) =>
  !!selectGitGlobal(state).importOverrideParams;

export const selectImportOverrideParams = (state: GitRootState) =>
  selectGitGlobal(state).importOverrideParams ?? null;

export const selectGitImportState = (state: GitRootState) =>
  selectGitGlobal(state).gitImport;

export const selectFetchGlobalSSHKeyState = (state: GitRootState) =>
  selectGitGlobal(state).globalSSHKey;

export const selectRepoLimitErrorModalOpen = (state: GitRootState) =>
  selectGitGlobal(state).repoLimitErrorModalOpen;

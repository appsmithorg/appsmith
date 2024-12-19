import type { GitRootState } from "../types";

export const selectGitConfig = (state: GitRootState) => {
  return state.git.config;
};

// global profile
export const selectFetchGlobalProfileState = (state: GitRootState) =>
  selectGitConfig(state).globalProfile;

export const selectUpdateGlobalProfileState = (state: GitRootState) =>
  selectGitConfig(state).updateGlobalProfile;

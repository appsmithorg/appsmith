import type { AppState } from "@appsmith/reducers";

export const getGitProtectedBranches = (state: AppState) => {
  const defaultBranch = state.ui.gitSync.branches.find((b) => b.default);
  let protectedBranches: string[] = [];
  if (defaultBranch) {
    protectedBranches = [defaultBranch.branchName];
  }
  return protectedBranches;
};

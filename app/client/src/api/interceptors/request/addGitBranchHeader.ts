import store from "store";
import type { InternalAxiosRequestConfig } from "axios";
import getQueryParamsObject from "utils/getQueryParamsObject";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";

export const addGitBranchHeader = (config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  config.headers = config.headers || {};

  const branch = getCurrentGitBranch(state) || getQueryParamsObject().branch;

  if (branch) {
    config.headers.branchName = branch;
  }

  return config;
};

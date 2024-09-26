import type { InternalAxiosRequestConfig } from "axios";

export const addGitBranchHeader = (
  config: InternalAxiosRequestConfig,
  options: { branch?: string },
) => {
  const { branch } = options;

  config.headers = config.headers || {};

  if (branch) {
    config.headers.branchName = branch;
  }

  return config;
};

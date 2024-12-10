import type { ApiResponse } from "api/types";

export interface FetchGitMetadataResponseData {
  branchName: string;
  defaultBranchName: string;
  remoteUrl: string;
  repoName: string;
  browserSupportedUrl?: string;
  isRepoPrivate?: boolean;
  browserSupportedRemoteUrl: string;
  defaultApplicationId: string;
  isProtectedBranch: boolean;
  autoCommitConfig: {
    enabled: boolean;
  };
  isAutoDeploymentEnabled?: boolean;
}

export type FetchGitMetadataResponse =
  ApiResponse<FetchGitMetadataResponseData>;

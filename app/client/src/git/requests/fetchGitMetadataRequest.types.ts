export interface FetchGitMetadataResponse {
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

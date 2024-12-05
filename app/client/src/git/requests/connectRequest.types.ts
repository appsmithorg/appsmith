export interface ConnectRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

export interface ConnectResponse {
  id: string;
  baseId: string;
  gitApplicationMetadata: {
    branchName: string;
    browserSupportedRemoteUrl: string;
    defaultApplicationId: string;
    defaultArtifactId: string;
    defaultBranchName: string;
    isRepoPrivate: boolean;
    lastCommitedAt: string;
    remoteUrl: string;
    repoName: string;
  };
}

export interface ImportGitRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

export interface ImportGitResponse {
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

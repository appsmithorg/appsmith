import type { ApiResponse } from "api/types";

export interface GitImportRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

export interface GitImportResponseData {
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

export type GitImportResponse = ApiResponse<GitImportResponseData>;

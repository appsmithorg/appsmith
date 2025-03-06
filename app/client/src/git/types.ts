import type { GitArtifactType } from "./constants/enums";

export interface GitRef {
  refName: string;
  refType: string;
  createdFromLocal: string;
  default: boolean;
}
export interface GitBranch {
  branchName: string;
  default: boolean;
}

export interface GitArtifactDef {
  artifactType: GitArtifactType;
  baseArtifactId: string;
}

interface GitApplicationArtifactPage {
  id: string;
  baseId: string;
  isDefault: boolean;
}

export interface GitApplicationArtifact {
  id: string;
  baseId: string;
  name: string;
  pages: GitApplicationArtifactPage[];
  lastDeployedAt?: string;
  gitApplicationMetadata?: {
    branchName: string;
    defaultBranchName: string;
    remoteUrl: string;
    repoName: string;
    browserSupportedUrl?: string;
    isRepoPrivate?: boolean;
    browserSupportedRemoteUrl: string;
    defaultApplicationId: string;
  };
}

export interface GitPackageArtifact {
  id: string;
  baseId: string;
  name: string;
  lastDeployedAt?: string;
  gitArtifactMetadata?: {
    branchName: string;
    defaultBranchName: string;
    remoteUrl: string;
    repoName: string;
    browserSupportedUrl?: string;
    isRepoPrivate?: boolean;
    browserSupportedRemoteUrl: string;
    defaultApplicationId: string;
  };
}

export type GitArtifact = GitApplicationArtifact | GitPackageArtifact;

import type { Package } from "ee/constants/PackageConstants";
import type { ApplicationPayload } from "entities/Application";

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

export type GitApplicationArtifact = ApplicationPayload;

export type GitPackageArtifact = Package;

export type GitArtifact = GitApplicationArtifact | GitPackageArtifact;

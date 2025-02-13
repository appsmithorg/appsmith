import type { Package } from "ee/constants/PackageConstants";
import type { ApplicationPayload } from "entities/Application";
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

export type GitApplicationArtifact = ApplicationPayload;

export type GitPackageArtifact = Package;

export type GitArtifact = GitApplicationArtifact | GitPackageArtifact;

import type { PayloadAction } from "@reduxjs/toolkit";

export interface GitMetadata {}

export interface GitBranches {}

export interface GitStatus {}

export interface GitSingleArtifactReduxState {
  metadata: {
    value: GitMetadata | null;
    loading: boolean;
    error: string | null;
  };
  connect: {
    loading: boolean;
    error: string | null;
  };
  branches: {
    value: GitBranches | null;
    loading: boolean;
    error: string | null;
  };
  status: {
    value: GitStatus | null;
    loading: boolean;
    error: string | null;
  };
  commit: {
    value: string | null;
    loading: boolean;
    error: string | null;
  };
  pull: {
    loading: boolean;
    error: string | null;
  };
}

export interface GitArtifactReduxState {
  [key: string]: Record<string, GitSingleArtifactReduxState>;
}

export interface GitArtifactBasePayload {
  artifactType: string;
  baseArtifactId: string;
}

export type GitArtifactPayloadAction<T = Record<string, unknown>> =
  PayloadAction<GitArtifactBasePayload & T>;

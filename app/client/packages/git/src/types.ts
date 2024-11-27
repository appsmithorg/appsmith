import type { PayloadAction } from "@reduxjs/toolkit";

// These will be updated when contracts are finalized
export type GitMetadata = Record<string, unknown>;

export type GitBranches = Record<string, unknown>;

export type GitStatus = Record<string, unknown>;

interface AsyncState<T = unknown> {
  value: T | null;
  loading: boolean;
  error: string | null;
}

export interface GitSingleArtifactReduxState {
  metadata: AsyncState<GitMetadata>;
  connect: Omit<AsyncState, "value">;
  branches: AsyncState<GitBranches>;
  status: AsyncState<GitStatus>;
  commit: Omit<AsyncState, "value">;
  pull: Omit<AsyncState, "value">;
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

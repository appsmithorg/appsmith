import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  GitArtifactType,
  GitConnectStep,
  GitImportStep,
  GitOpsTab,
  GitSettingsTab,
} from "../constants/enums";
import type { FetchGlobalProfileResponseData } from "../requests/fetchGlobalProfileRequest.types";
import type { FetchBranchesResponseData } from "../requests/fetchBranchesRequest.types";
import type { FetchLocalProfileResponseData } from "../requests/fetchLocalProfileRequest.types";

// These will be updated when contracts are finalized
export type GitMetadata = Record<string, unknown>;

export type GitStatus = Record<string, unknown>;

export type GitMergeStatus = Record<string, unknown>;

export type GitLocalProfile = Record<string, unknown>;

export type GitProtectedBranches = Record<string, unknown>;

export type GitAutocommitProgress = Record<string, unknown>;

export type GitSSHKey = Record<string, unknown>;

interface AsyncState<T = unknown> {
  value: T | null;
  loading: boolean;
  error: string | null;
}

interface AsyncStateWithoutValue {
  loading: boolean;
  error: string | null;
}
export interface GitSingleArtifactAPIResponsesReduxState {
  metadata: AsyncState<GitMetadata>;
  connect: AsyncStateWithoutValue;
  status: AsyncState<GitStatus>;
  commit: AsyncStateWithoutValue;
  pull: AsyncStateWithoutValue;
  discard: AsyncStateWithoutValue;
  mergeStatus: AsyncState<GitMergeStatus>;
  merge: AsyncStateWithoutValue;
  branches: AsyncState<FetchBranchesResponseData>;
  checkoutBranch: AsyncStateWithoutValue;
  createBranch: AsyncStateWithoutValue;
  deleteBranch: AsyncStateWithoutValue;
  localProfile: AsyncState<FetchLocalProfileResponseData>;
  updateLocalProfile: AsyncStateWithoutValue;
  disconnect: AsyncStateWithoutValue;
  protectedBranches: AsyncState<GitProtectedBranches>;
  updateProtectedBranches: AsyncStateWithoutValue;
  autocommitProgress: AsyncState<GitAutocommitProgress>;
  toggleAutocommit: AsyncStateWithoutValue;
  triggerAutocommit: AsyncStateWithoutValue;
  sshKey: AsyncState<GitSSHKey>;
  generateSSHKey: AsyncStateWithoutValue;
}

export interface GitSingleArtifactUIReduxState {
  connectModal: {
    open: boolean;
    step: keyof typeof GitConnectStep;
  };
  importModal: {
    open: boolean;
    step: keyof typeof GitImportStep;
  };
  branchListPopup: {
    open: boolean;
  };
  opsModal: {
    open: boolean;
    tab: keyof typeof GitOpsTab;
  };
  settingsModal: {
    open: boolean;
    tab: keyof typeof GitSettingsTab;
  };
  repoLimitErrorModal: {
    open: boolean;
  };
}
export interface GitSingleArtifactReduxState {
  ui: GitSingleArtifactUIReduxState;
  apiResponses: GitSingleArtifactAPIResponsesReduxState;
}

export interface GitArtifactReduxState {
  [key: string]: Record<string, GitSingleArtifactReduxState>;
}

export interface GitConfigReduxState {
  globalProfile: AsyncState<FetchGlobalProfileResponseData>;
  updateGlobalProfile: AsyncStateWithoutValue;
}

export interface GitArtifactBasePayload {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface GitAsyncErrorPayload {
  error: string;
}

export interface GitAsyncSuccessPayload<T> {
  responseData: T;
}

export type GitArtifactPayload<T = Record<string, never>> =
  GitArtifactBasePayload & T;

export type GitArtifactPayloadAction<T = Record<string, never>> = PayloadAction<
  GitArtifactPayload<T>
>;

export type GitArtifactErrorPayloadAction =
  GitArtifactPayloadAction<GitAsyncErrorPayload>;

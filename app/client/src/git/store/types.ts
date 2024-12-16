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
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { FetchMergeStatusResponseData } from "git/requests/fetchMergeStatusRequest.types";
import type { FetchGitMetadataResponseData } from "git/requests/fetchGitMetadataRequest.types";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";
import type { ApiResponseError } from "api/types";

export type GitSSHKey = Record<string, unknown>;

export interface GitApiError extends ApiResponseError {
  errorType?: string;
  referenceDoc?: string;
  title?: string;
}
interface GitAsyncState<T = unknown> {
  value: T | null;
  loading: boolean;
  error: GitApiError | null;
}

interface GitAsyncStateWithoutValue {
  loading: boolean;
  error: GitApiError | null;
}
export interface GitSingleArtifactAPIResponsesReduxState {
  metadata: GitAsyncState<FetchGitMetadataResponseData>;
  connect: GitAsyncStateWithoutValue;
  status: GitAsyncState<FetchStatusResponseData>;
  commit: GitAsyncStateWithoutValue;
  pull: GitAsyncStateWithoutValue;
  discard: GitAsyncStateWithoutValue;
  mergeStatus: GitAsyncState<FetchMergeStatusResponseData>;
  merge: GitAsyncStateWithoutValue;
  branches: GitAsyncState<FetchBranchesResponseData>;
  checkoutBranch: GitAsyncStateWithoutValue;
  createBranch: GitAsyncStateWithoutValue;
  deleteBranch: GitAsyncStateWithoutValue;
  localProfile: GitAsyncState<FetchLocalProfileResponseData>;
  updateLocalProfile: GitAsyncStateWithoutValue;
  disconnect: GitAsyncStateWithoutValue;
  protectedBranches: GitAsyncState<FetchProtectedBranchesResponseData>;
  updateProtectedBranches: GitAsyncStateWithoutValue;
  autocommitProgress: GitAsyncStateWithoutValue;
  toggleAutocommit: GitAsyncStateWithoutValue;
  triggerAutocommit: GitAsyncStateWithoutValue;
  sshKey: GitAsyncState<GitSSHKey>;
  generateSSHKey: GitAsyncStateWithoutValue;
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
  opsModalOpen: boolean;
  opsModalTab: keyof typeof GitOpsTab;
  conflictErrorModalOpen: boolean;
  settingsModal: {
    open: boolean;
    tab: keyof typeof GitSettingsTab;
  };
  repoLimitErrorModal: {
    open: boolean;
  };
  autocommitPolling: boolean;
  autocommitModalOpen: boolean;
}
export interface GitSingleArtifactReduxState {
  ui: GitSingleArtifactUIReduxState;
  apiResponses: GitSingleArtifactAPIResponsesReduxState;
}

export interface GitArtifactReduxState {
  [key: string]: Record<string, GitSingleArtifactReduxState>;
}

export interface GitConfigReduxState {
  globalProfile: GitAsyncState<FetchGlobalProfileResponseData>;
  updateGlobalProfile: GitAsyncStateWithoutValue;
}

export interface GitRootState {
  git: {
    artifacts: GitArtifactReduxState;
    config: GitConfigReduxState;
  };
}

export interface GitArtifactBasePayload {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export interface GitAsyncErrorPayload {
  error: GitApiError;
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

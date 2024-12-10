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

export type GitSSHKey = Record<string, unknown>;

export interface AsyncState<T = unknown> {
  value: T | null;
  loading: boolean;
  error: string | null;
}

interface AsyncStateWithoutValue {
  loading: boolean;
  error: string | null;
}
export interface GitSingleArtifactAPIResponsesReduxState {
  metadata: AsyncState<FetchGitMetadataResponseData>;
  connect: AsyncStateWithoutValue;
  status: AsyncState<FetchStatusResponseData>;
  commit: AsyncStateWithoutValue;
  pull: AsyncStateWithoutValue;
  discard: AsyncStateWithoutValue;
  mergeStatus: AsyncState<FetchMergeStatusResponseData>;
  merge: AsyncStateWithoutValue;
  branches: AsyncState<FetchBranchesResponseData>;
  checkoutBranch: AsyncStateWithoutValue;
  createBranch: AsyncStateWithoutValue;
  deleteBranch: AsyncStateWithoutValue;
  localProfile: AsyncState<FetchLocalProfileResponseData>;
  updateLocalProfile: AsyncStateWithoutValue;
  disconnect: AsyncStateWithoutValue;
  protectedBranches: AsyncState<FetchProtectedBranchesResponseData>;
  updateProtectedBranches: AsyncStateWithoutValue;
  autocommitProgress: AsyncStateWithoutValue;
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
  globalProfile: AsyncState<FetchGlobalProfileResponseData>;
  updateGlobalProfile: AsyncStateWithoutValue;
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

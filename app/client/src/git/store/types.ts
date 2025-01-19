import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  GitArtifactType,
  GitOpsTab,
  GitSettingsTab,
} from "../constants/enums";
import type { FetchGlobalProfileResponseData } from "../requests/fetchGlobalProfileRequest.types";
import type { FetchBranchesResponseData } from "../requests/fetchBranchesRequest.types";
import type { FetchLocalProfileResponseData } from "../requests/fetchLocalProfileRequest.types";
import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import type { FetchMergeStatusResponseData } from "git/requests/fetchMergeStatusRequest.types";
import type { FetchMetadataResponseData } from "git/requests/fetchMetadataRequest.types";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";
import type { ApiResponseError } from "api/types";
import type { FetchSSHKeyResponseData } from "git/requests/fetchSSHKeyRequest.types";
import type {
  GitArtifactAPIResponsesReduxState as GitArtifactAPIResponsesReduxStateExtended,
  GitArtifactUIReduxState as GitArtifactUIReduxStateExtended,
} from "git/ee/store/types";
import type { FetchGlobalSSHKeyResponseData } from "git/requests/fetchGlobalSSHKeyRequest.types";
import type { ApplicationPayload } from "entities/Application";

export interface GitApiError extends ApiResponseError {
  errorType?: string;
  referenceDoc?: string;
  title?: string;
}
export interface GitAsyncState<T = unknown> {
  value: T | null;
  loading: boolean;
  error: GitApiError | null;
}

export interface GitAsyncStateWithoutValue {
  loading: boolean;
  error: GitApiError | null;
}
export interface GitArtifactAPIResponsesReduxState
  extends GitArtifactAPIResponsesReduxStateExtended {
  metadata: GitAsyncState<FetchMetadataResponseData>;
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
  sshKey: GitAsyncState<FetchSSHKeyResponseData>;
  generateSSHKey: GitAsyncStateWithoutValue;
}

export interface GitArtifactUIReduxState
  extends GitArtifactUIReduxStateExtended {
  initializing: boolean;
  initialized: boolean;
  connectModalOpen: boolean;
  connectSuccessModalOpen: boolean;
  disconnectBaseArtifactId: string | null;
  disconnectArtifactType: keyof typeof GitArtifactType | null;
  disconnectArtifactName: string | null;
  branchPopupOpen: boolean;
  checkoutDestBranch: string | null;
  opsModalOpen: boolean;
  opsModalTab: keyof typeof GitOpsTab;
  mergeSuccess: boolean;
  settingsModalOpen: boolean;
  settingsModalTab: keyof typeof GitSettingsTab;
  autocommitDisableModalOpen: boolean;
  autocommitPolling: boolean;
  conflictErrorModalOpen: boolean;
}

export type GitArtifact = ApplicationPayload;

export interface GitArtifactDef {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}
export interface GitArtifactReduxState {
  ui: GitArtifactUIReduxState;
  apiResponses: GitArtifactAPIResponsesReduxState;
}

export interface GitGlobalReduxState {
  globalProfile: GitAsyncState<FetchGlobalProfileResponseData>;
  updateGlobalProfile: GitAsyncStateWithoutValue;
  gitImport: GitAsyncStateWithoutValue;
  globalSSHKey: GitAsyncState<FetchGlobalSSHKeyResponseData>;
  // ui
  isImportModalOpen: boolean;
  repoLimitErrorModalOpen: boolean;
}

export type GitArtifactRootReduxState = Record<
  string,
  Record<string, GitArtifactReduxState>
>;

export interface GitReduxState {
  artifacts: GitArtifactRootReduxState;
  global: GitGlobalReduxState;
}

export interface GitRootState {
  // will have to remove this later, once metadata is fixed
  ui: {
    applications: {
      currentApplication?: {
        gitApplicationMetadata?: {
          branchName: string;
        };
      };
    };
  };
  git: GitReduxState;
}

export interface GitArtifactBasePayload {
  artifactDef: GitArtifactDef;
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

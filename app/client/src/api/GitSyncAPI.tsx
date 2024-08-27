import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { GitConfig } from "entities/GitSync";
import ApplicationApi from "ee/api/ApplicationApi";

export interface CommitPayload {
  applicationId: string;
  commitMessage: string;
  doPush: boolean;
}

export interface MergeBranchPayload {
  applicationId: string;
  sourceBranch: string;
  destinationBranch: string;
}

export interface MergeStatusPayload {
  applicationId: string;
  sourceBranch: string;
  destinationBranch: string;
}

export interface ConnectToGitPayload {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

interface GitStatusParam {
  applicationId: string;
  compareRemote: boolean;
}

export enum AutocommitResponseEnum {
  IN_PROGRESS = "IN_PROGRESS",
  LOCKED = "LOCKED",
  PUBLISHED = "PUBLISHED",
  IDLE = "IDLE",
  NOT_REQUIRED = "NOT_REQUIRED",
  NON_GIT_APP = "NON_GIT_APP",
}

export interface GitAutocommitProgressResponse {
  autoCommitResponse: AutocommitResponseEnum;
  progress: number;
  branchName: string;
}

export interface GitTriggerAutocommitResponse {
  autoCommitResponse: AutocommitResponseEnum;
  progress: number;
  branchName: string;
}

class GitSyncAPI extends Api {
  static baseURL = `/v1/git`;

  static async commit({
    applicationId,
    commitMessage,
    doPush,
  }: CommitPayload): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(`${GitSyncAPI.baseURL}/commit/app/${applicationId}`, {
      commitMessage,
      doPush,
    });
  }

  static async merge({
    applicationId,
    destinationBranch,
    sourceBranch,
  }: MergeBranchPayload): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(`${GitSyncAPI.baseURL}/merge/app/${applicationId}`, {
      sourceBranch,
      destinationBranch,
    });
  }

  static async getMergeStatus({
    applicationId,
    destinationBranch,
    sourceBranch,
  }: MergeStatusPayload) {
    return Api.post(`${GitSyncAPI.baseURL}/merge/status/app/${applicationId}`, {
      sourceBranch,
      destinationBranch,
    });
  }

  static async pull({ applicationId }: { applicationId: string }) {
    return Api.get(`${GitSyncAPI.baseURL}/pull/app/${applicationId}`);
  }

  static async connect(
    payload: ConnectToGitPayload,
    baseApplicationId: string,
  ) {
    return Api.post(
      `${GitSyncAPI.baseURL}/connect/app/${baseApplicationId}`,
      payload,
    );
  }

  static async getGlobalConfig() {
    return Api.get(`${GitSyncAPI.baseURL}/profile/default`);
  }

  static async setGlobalConfig(payload: GitConfig) {
    return Api.post(`${GitSyncAPI.baseURL}/profile/default`, payload);
  }

  static async fetchBranches(applicationId: string, pruneBranches?: boolean) {
    const queryParams = {} as { pruneBranches?: boolean };
    if (pruneBranches) queryParams.pruneBranches = true;
    return Api.get(
      `${GitSyncAPI.baseURL}/branch/app/${applicationId}`,
      queryParams,
    );
  }

  static async checkoutBranch(applicationId: string, branch: string) {
    return Api.get(
      `${GitSyncAPI.baseURL}/checkout-branch/app/${applicationId}`,
      {
        branchName: branch,
      },
    );
  }

  static async createNewBranch(applicationId: string, branch: string) {
    return Api.post(
      `${GitSyncAPI.baseURL}/create-branch/app/${applicationId}`,
      {
        branchName: branch,
      },
    );
  }

  static async getLocalConfig(baseApplicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/profile/app/${baseApplicationId}`);
  }

  static async setLocalConfig(payload: GitConfig, baseApplicationId: string) {
    return Api.put(
      `${GitSyncAPI.baseURL}/profile/app/${baseApplicationId}`,
      payload,
    );
  }

  static async getGitStatus({
    applicationId,
    compareRemote = true,
  }: GitStatusParam) {
    return Api.get(`${GitSyncAPI.baseURL}/status/app/${applicationId}`, {
      compareRemote,
    });
  }

  static async revokeGit(baseApplicationId: string) {
    return Api.post(
      `${GitSyncAPI.baseURL}/disconnect/app/${baseApplicationId}`,
    );
  }

  static async importApp(payload: ConnectToGitPayload, workspaceId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/import/${workspaceId}`, payload);
  }

  static async getSSHKeyPair(
    baseApplicationId: string,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.get(
      ApplicationApi.baseURL + "/ssh-keypair/" + baseApplicationId,
    );
  }

  static async generateSSHKeyPair(
    baseApplicationId: string,
    keyType: string,
    isImporting?: boolean,
  ): Promise<AxiosPromise<ApiResponse>> {
    const url = isImporting
      ? `v1/git/import/keys?keyType=${keyType}`
      : `${ApplicationApi.baseURL}/ssh-keypair/${baseApplicationId}?keyType=${keyType}`;
    return isImporting ? Api.get(url) : Api.post(url);
  }

  static async deleteBranch(
    baseApplicationId: string,
    branchName: string,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.delete(GitSyncAPI.baseURL + "/branch/app/" + baseApplicationId, {
      branchName,
    });
  }

  static async discardChanges(applicationId: string) {
    return Api.put(`${GitSyncAPI.baseURL}/discard/app/${applicationId}`);
  }

  static async getProtectedBranches(baseApplicationId: string) {
    return Api.get(
      `${GitSyncAPI.baseURL}/branch/app/${baseApplicationId}/protected`,
    );
  }

  static async updateProtectedBranches(
    baseApplicationId: string,
    branchNames: string[],
  ) {
    return Api.post(
      `${GitSyncAPI.baseURL}/branch/app/${baseApplicationId}/protected`,
      { branchNames },
    );
  }

  static async getGitMetadata(baseApplicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/metadata/app/${baseApplicationId}`);
  }

  static async toggleAutocommit(baseApplicationId: string) {
    return Api.patch(
      `${GitSyncAPI.baseURL}/auto-commit/toggle/app/${baseApplicationId}`,
    );
  }

  static async triggerAutocommit(applicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/auto-commit/app/${applicationId}`);
  }

  static async getAutocommitProgress(baseApplicationId: string) {
    return Api.get(
      `${GitSyncAPI.baseURL}/auto-commit/progress/app/${baseApplicationId}`,
    );
  }
}

export default GitSyncAPI;

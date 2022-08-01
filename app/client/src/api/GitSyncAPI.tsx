import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";
import ApplicationApi from "./ApplicationApi";

export type CommitPayload = {
  applicationId: string;
  commitMessage: string;
  doPush: boolean;
  branch: string;
};

export type MergeBranchPayload = {
  applicationId: string;
  sourceBranch: string;
  destinationBranch: string;
};

export type MergeStatusPayload = {
  applicationId: string;
  sourceBranch: string;
  destinationBranch: string;
};

export type ConnectToGitPayload = {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
  };
  isDefaultProfile?: boolean;
};

type GitStatusParam = {
  applicationId: string;
  branch: string;
};

class GitSyncAPI extends Api {
  static baseURL = `/v1/git`;

  static commit({
    applicationId,
    branch,
    commitMessage,
    doPush,
  }: CommitPayload): AxiosPromise<ApiResponse> {
    return Api.post(
      `${GitSyncAPI.baseURL}/commit/app/${applicationId}?branchName=${branch}`,
      {
        commitMessage,
        doPush,
      },
    );
  }

  static merge({
    applicationId,
    destinationBranch,
    sourceBranch,
  }: MergeBranchPayload): AxiosPromise<ApiResponse> {
    return Api.post(`${GitSyncAPI.baseURL}/merge/app/${applicationId}`, {
      sourceBranch,
      destinationBranch,
    });
  }

  static getMergeStatus({
    applicationId,
    destinationBranch,
    sourceBranch,
  }: MergeStatusPayload) {
    return Api.post(`${GitSyncAPI.baseURL}/merge/status/app/${applicationId}`, {
      sourceBranch,
      destinationBranch,
    });
  }

  static pull({ applicationId }: { applicationId: string }) {
    return Api.get(`${GitSyncAPI.baseURL}/pull/app/${applicationId}`);
  }

  static connect(payload: ConnectToGitPayload, applicationId: string) {
    return Api.post(
      `${GitSyncAPI.baseURL}/connect/app/${applicationId}`,
      payload,
    );
  }

  static getGlobalConfig() {
    return Api.get(`${GitSyncAPI.baseURL}/profile/default`);
  }

  static setGlobalConfig(payload: GitConfig) {
    return Api.post(`${GitSyncAPI.baseURL}/profile/default`, payload);
  }

  static fetchBranches(applicationId: string, pruneBranches?: boolean) {
    const queryParams = {} as { pruneBranches?: boolean };
    if (pruneBranches) queryParams.pruneBranches = true;
    return Api.get(
      `${GitSyncAPI.baseURL}/branch/app/${applicationId}`,
      queryParams,
    );
  }

  static checkoutBranch(applicationId: string, branch: string) {
    return Api.get(
      `${GitSyncAPI.baseURL}/checkout-branch/app/${applicationId}`,
      {
        branchName: branch,
      },
    );
  }

  static createNewBranch(applicationId: string, branch: string) {
    return Api.post(
      `${GitSyncAPI.baseURL}/create-branch/app/${applicationId}`,
      {
        branchName: branch,
      },
    );
  }

  static getLocalConfig(applicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/profile/app/${applicationId}`);
  }

  static setLocalConfig(payload: GitConfig, applicationId: string) {
    return Api.put(
      `${GitSyncAPI.baseURL}/profile/app/${applicationId}`,
      payload,
    );
  }

  static getGitStatus({ applicationId, branch }: GitStatusParam) {
    return Api.get(
      `${GitSyncAPI.baseURL}/status/app/${applicationId}?branchName=${branch}`,
    );
  }

  static disconnectGit({ applicationId }: { applicationId: string }) {
    return Api.post(`${GitSyncAPI.baseURL}/disconnect/app/${applicationId}`);
  }

  static importApp(payload: ConnectToGitPayload, workspaceId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/import/${workspaceId}`, payload);
  }

  static getSSHKeyPair(applicationId: string): AxiosPromise<ApiResponse> {
    return Api.get(ApplicationApi.baseURL + "/ssh-keypair/" + applicationId);
  }

  static generateSSHKeyPair(
    applicationId: string,
    keyType: string,
    isImporting?: boolean,
  ): AxiosPromise<ApiResponse> {
    const url = isImporting
      ? `v1/git/import/keys?keyType=${keyType}`
      : `${ApplicationApi.baseURL}/ssh-keypair/${applicationId}?keyType=${keyType}`;
    return isImporting ? Api.get(url) : Api.post(url);
  }

  static deleteBranch(
    applicationId: string,
    branchName: string,
  ): AxiosPromise<ApiResponse> {
    return Api.delete(GitSyncAPI.baseURL + "/branch/app/" + applicationId, {
      branchName,
    });
  }

  static discardChanges(applicationId: string, doPull: boolean) {
    return Api.put(
      `${GitSyncAPI.baseURL}/discard/app/${applicationId}?doPull=${doPull}`,
    );
  }
}

export default GitSyncAPI;

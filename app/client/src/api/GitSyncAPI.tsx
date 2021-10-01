import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";

export type CommitPayload = {
  applicationId: string;
  branch: string;
  commitMessage: string;
  doPush: boolean;
};

export type PushToGitPayload = {
  applicationId: string;
};

export type ConnectToGitPayload = {
  remoteUrl: string;
  gitProfile: {
    authorName: string;
    authorEmail: string;
  };
  isImport?: boolean;
  isDefaultProfile?: boolean;
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
      `${GitSyncAPI.baseURL}/commit/${applicationId}`,
      {
        commitMessage,
        doPush,
      },
      { branchName: branch },
    );
  }

  static push({ applicationId }: PushToGitPayload): AxiosPromise<ApiResponse> {
    return Api.post(`${GitSyncAPI.baseURL}/push/${applicationId}`);
  }

  static connect(payload: ConnectToGitPayload, applicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/${applicationId}`, payload);
  }

  static getGlobalConfig() {
    return Api.get(`${GitSyncAPI.baseURL}/config`);
  }

  static setGlobalConfig(payload: GitConfig) {
    return Api.post(`${GitSyncAPI.baseURL}/config/save`, payload);
  }

  static fetchBranches(applicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/branch/${applicationId}`);
  }

  static checkoutBranch(applicationId: string, branchName: string) {
    return Api.get(`${GitSyncAPI.baseURL}/checkout-branch/${applicationId}`, {
      branchName,
    });
  }

  static createNewBranch(
    applicationId: string,
    branchName: string,
    parentBranch: string,
  ) {
    return Api.post(
      `${GitSyncAPI.baseURL}/create-branch/${applicationId}`,
      {
        branchName,
      },
      { branchName: parentBranch },
    );
  }

  static getLocalConfig(applicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/config/${applicationId}`);
  }

  static setLocalConfig(payload: GitConfig, applicationId: string) {
    return Api.put(`${GitSyncAPI.baseURL}/config/${applicationId}`, payload);
  }
}

export default GitSyncAPI;

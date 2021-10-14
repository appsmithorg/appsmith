import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";

export type CommitPayload = {
  applicationId: string;
  commitMessage: string;
  doPush: boolean;
};

export type PushToGitPayload = {
  defaultApplicationId: string;
  branchName: string;
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

type GitStatusParam = {
  defaultApplicationId: string;
  branchName: string;
};

class GitSyncAPI extends Api {
  static baseURL = `/v1/git`;

  static commit({
    applicationId,
    commitMessage,
    doPush,
  }: CommitPayload): AxiosPromise<ApiResponse> {
    return Api.post(`${GitSyncAPI.baseURL}/commit/${applicationId}`, {
      commitMessage,
      doPush,
    });
  }

  static push({
    branchName,
    defaultApplicationId,
  }: PushToGitPayload): AxiosPromise<ApiResponse> {
    return Api.post(
      `${GitSyncAPI.baseURL}/push/${defaultApplicationId}?branchName=${branchName}`,
    );
  }

  static connect(payload: ConnectToGitPayload, applicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/${applicationId}`, payload);
  }

  static disconnect(defaultApplicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/disconnect/${defaultApplicationId}`);
  }

  static getGlobalConfig() {
    return Api.get(`${GitSyncAPI.baseURL}/profile/default`);
  }

  static setGlobalConfig(payload: GitConfig) {
    return Api.post(`${GitSyncAPI.baseURL}/profile/default`, payload);
  }

  static getLocalConfig(applicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/profile/${applicationId}`);
  }

  static setLocalConfig(payload: GitConfig, defaultApplicationId: string) {
    return Api.put(
      `${GitSyncAPI.baseURL}/profile/${defaultApplicationId}`,
      payload,
    );
  }

  static fetchBranches(applicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/branch/${applicationId}`);
  }

  static checkoutBranch(applicationId: string, branch: string) {
    return Api.get(`${GitSyncAPI.baseURL}/checkout-branch/${applicationId}`, {
      branch,
    });
  }

  static createNewBranch(applicationId: string, branch: string) {
    return Api.post(`${GitSyncAPI.baseURL}/create-branch/${applicationId}`, {
      branch,
    });
  }

  static getGitStatus({ branchName, defaultApplicationId }: GitStatusParam) {
    return Api.get(
      `${GitSyncAPI.baseURL}/status/${defaultApplicationId}?branchName=${branchName}`,
    );
  }
}

export default GitSyncAPI;

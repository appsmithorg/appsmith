import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";

export type CommitPayload = {
  applicationId: string;
  commitMessage: string;
  doPush: boolean;
  branchName: string;
};

export type PushToGitPayload = {
  applicationId: string;
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
    branchName,
    commitMessage,
    doPush,
  }: CommitPayload): AxiosPromise<ApiResponse> {
    return Api.post(
      `${GitSyncAPI.baseURL}/commit/${applicationId}?branchName=${branchName}`,
      {
        commitMessage,
        doPush,
      },
    );
  }

  static push({
    applicationId,
    branchName,
  }: PushToGitPayload): AxiosPromise<ApiResponse> {
    return Api.post(
      `${GitSyncAPI.baseURL}/push/${applicationId}?branchName=${branchName}`,
    );
  }

  static connect(payload: ConnectToGitPayload, applicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/${applicationId}`, payload);
  }

  static getGlobalConfig() {
    return Api.get(`${GitSyncAPI.baseURL}/profile`);
  }

  static setGlobalConfig(payload: GitConfig) {
    return Api.post(`${GitSyncAPI.baseURL}/profile/save`, payload);
  }

  static getLocalConfig(defaultApplicationId: string) {
    return Api.get(`${GitSyncAPI.baseURL}/profile/${defaultApplicationId}`);
  }

  static setLocalConfig(payload: GitConfig, defaultApplicationId: string) {
    return Api.put(
      `${GitSyncAPI.baseURL}/profile/${defaultApplicationId}`,
      payload,
    );
  }

  static getGitStatus({ branchName, defaultApplicationId }: GitStatusParam) {
    return Api.get(
      `${GitSyncAPI.baseURL}/status/${defaultApplicationId}?branchName=${branchName}`,
    );
  }
}

export default GitSyncAPI;

import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";

export type CommitPayload = {
  applicationId: string;
  commitMessage: string;
  doPush: boolean;
  branch: string;
};

export type PushToGitPayload = {
  applicationId: string;
  branch: string;
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
      `${GitSyncAPI.baseURL}/commit/${applicationId}?branchName=${branch}`,
      {
        commitMessage,
        doPush,
      },
    );
  }

  static push({
    applicationId,
    branch,
  }: PushToGitPayload): AxiosPromise<ApiResponse> {
    return Api.post(
      `${GitSyncAPI.baseURL}/push/${applicationId}?branchName=${branch}`,
    );
  }

  static connect(payload: ConnectToGitPayload, applicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/${applicationId}`, payload);
  }

  static disconnect(applicationId: string) {
    return Api.post(`${GitSyncAPI.baseURL}/disconnect/${applicationId}`);
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

  static setLocalConfig(payload: GitConfig, applicationId: string) {
    return Api.put(`${GitSyncAPI.baseURL}/profile/${applicationId}`, payload);
  }

  static getGitStatus({ applicationId, branch }: GitStatusParam) {
    return Api.get(
      `${GitSyncAPI.baseURL}/status/${applicationId}?branchName=${branch}`,
    );
  }
}

export default GitSyncAPI;

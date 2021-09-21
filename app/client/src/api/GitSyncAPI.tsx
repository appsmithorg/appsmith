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
  applicationId: string;
};

export type ConnectToGitPayload = {
  applicationId: string;
  remoteUrl: string;
  gitConfig: {
    authorName: string;
    authorEmail: string;
  };
  organizationId?: string;
  isImport?: boolean;
  isDefaultProfile?: boolean;
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

  static push({ applicationId }: PushToGitPayload): AxiosPromise<ApiResponse> {
    return Api.post(`${GitSyncAPI.baseURL}/push/${applicationId}`);
  }

  static connect(payload: ConnectToGitPayload) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/`, payload);
  }

  static getGlobalConfig() {
    return Api.get(`${GitSyncAPI.baseURL}/config`);
  }

  static setGlobalConfig(payload: GitConfig) {
    return Api.post(`${GitSyncAPI.baseURL}/config/save`, payload);
  }
}

export default GitSyncAPI;

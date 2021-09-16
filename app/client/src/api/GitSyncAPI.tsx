import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";

export type CommitPayload = {
  applicationId: string;
  commitMessage: string;
  pushImmediately: boolean;
};

export type ConnectToGitPayload = {
  applicationId: string;
  remoteUrl: string;
  gitConfig: {
    authorName: string;
    authorEmail: string;
  };
  organizationId: string;
};

class GitSyncAPI extends Api {
  static baseURL = `/v1/git`;

  static commit({
    applicationId,
    commitMessage,
  }: CommitPayload): AxiosPromise<ApiResponse> {
    return Api.post(`${GitSyncAPI.baseURL}/commit/${applicationId}`, {
      commitMessage,
    });
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

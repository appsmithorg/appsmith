import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";

export type CommitPayload = {
  applicationId: string;
  commitMessage: string;
  doPush: boolean;
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

  static connect(payload: ConnectToGitPayload) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/`, payload);
  }
}

export default GitSyncAPI;

import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { GitConfig } from "entities/GitSync";

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

  static connect(payload: ConnectToGitPayload) {
    return Api.post(`${GitSyncAPI.baseURL}/connect/`, payload);
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
    return Api.get(
      `${GitSyncAPI.baseURL}/checkout-branch/${applicationId}/${branchName}`,
    );
  }

  static createNewBranch(
    applicationId: string,
    parentBranchName: string,
    branchName: string,
  ) {
    return Api.post(
      `${GitSyncAPI.baseURL}/create-branch/${applicationId}/${parentBranchName}`,
      {
        branchName,
      },
    );
  }
}

export default GitSyncAPI;

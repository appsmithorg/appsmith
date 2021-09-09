import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";

export type commitPayload = {
  applicationId: string;
  commitMessage: string;
  pushImmediately: boolean;
};

class GitSyncAPI extends Api {
  static baseURL = `/v1/git`;

  static commit({
    applicationId,
    commitMessage,
  }: commitPayload): AxiosPromise<ApiResponse> {
    return Api.post(`${GitSyncAPI.baseURL}/commit/${applicationId}`, {
      commitMessage,
    });
  }
}

export default GitSyncAPI;

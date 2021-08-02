import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";

class GitSyncAPI extends Api {
  static url = `v1/git-sync`;

  static fetchRepoDetails(): AxiosPromise<ApiResponse> {
    return Api.get(GitSyncAPI.url);
  }

  static updateRepo(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  // username:password
  static setRepoCredentials(): AxiosPromise<ApiResponse> {
    return Api.put(GitSyncAPI.url);
  }

  static fetchPublicKey(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  static testRepoAuthentication(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  static fetchLatestCommit(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  static fetchCommitsNotPushed(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  static fetchIfUncommitted(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  // separate APIs or a common api
  static commit(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  static pull(): AxiosPromise<ApiResponse> {
    return Api.get(GitSyncAPI.url);
  }

  static merge(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }

  static push(): AxiosPromise<ApiResponse> {
    return Api.post(GitSyncAPI.url);
  }
}

export default GitSyncAPI;

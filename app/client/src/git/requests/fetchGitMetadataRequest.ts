import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchGitMetadataResponse } from "./fetchGitMetadataRequest.types";

export default async function fetchGitMetadataRequest(
  baseApplicationId: string,
): AxiosPromise<FetchGitMetadataResponse> {
  return Api.get(`${GIT_BASE_URL}/metadata/app/${baseApplicationId}`);
}

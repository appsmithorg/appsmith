import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { FetchGitMetadataResponse } from "./fetchGitMetadataRequest.types";

export default async function fetchGitMetadataRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchGitMetadataResponse>> {
  return Api.get(`${GIT_BASE_URL}/metadata/app/${baseApplicationId}`);
}

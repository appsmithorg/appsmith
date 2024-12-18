import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchMetadataResponse } from "./fetchMetadataRequest.types";

export default async function fetchMetadataRequest(
  baseApplicationId: string,
): AxiosPromise<FetchMetadataResponse> {
  return Api.get(`${GIT_BASE_URL}/metadata/app/${baseApplicationId}`);
}

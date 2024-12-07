import Api from "api/Api";
import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import type { FetchLocalProfileResponse } from "./fetchLocalProfileRequest.types";

export default async function fetchLocalProfileRequest(
  baseApplicationId: string,
): AxiosPromise<FetchLocalProfileResponse> {
  return Api.get(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`);
}

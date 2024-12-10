import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchGlobalProfileResponse } from "./fetchGlobalProfileRequest.types";

export default async function fetchGlobalProfileRequest(): AxiosPromise<FetchGlobalProfileResponse> {
  return Api.get(`${GIT_BASE_URL}/profile/default`);
}

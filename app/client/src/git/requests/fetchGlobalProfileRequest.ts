import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchGlobalProfileResponse } from "./fetchGlobalProfileRequest.types";

async function fetchGlobalProfileRequestOld(): AxiosPromise<FetchGlobalProfileResponse> {
  return Api.get(`${GIT_BASE_URL}/profile/default`);
}

async function fetchGlobalProfileRequestNew(): AxiosPromise<FetchGlobalProfileResponse> {
  return Api.get(`${GIT_BASE_URL}/artifacts/profile/default`);
}

export default async function fetchGlobalProfileRequest(
  isNew: boolean,
): AxiosPromise<FetchGlobalProfileResponse> {
  if (isNew) {
    return fetchGlobalProfileRequestNew();
  } else {
    return fetchGlobalProfileRequestOld();
  }
}

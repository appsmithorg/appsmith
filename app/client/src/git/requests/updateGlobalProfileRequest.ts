import type { AxiosPromise } from "axios";
import type {
  UpdateGlobalProfileRequestParams,
  UpdateGlobalProfileResponse,
} from "./updateGlobalProfileRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

async function updateGlobalProfileRequestOld(
  params: UpdateGlobalProfileRequestParams,
): AxiosPromise<UpdateGlobalProfileResponse> {
  return Api.post(`${GIT_BASE_URL}/profile/default`, params);
}

async function updateGlobalProfileRequestNew(
  params: UpdateGlobalProfileRequestParams,
): AxiosPromise<UpdateGlobalProfileResponse> {
  return Api.post(`${GIT_BASE_URL}/artifacts/profile/default`, params);
}

export default async function updateGlobalProfileRequest(
  params: UpdateGlobalProfileRequestParams,
  isNew: boolean,
): AxiosPromise<UpdateGlobalProfileResponse> {
  if (isNew) {
    return updateGlobalProfileRequestNew(params);
  } else {
    return updateGlobalProfileRequestOld(params);
  }
}

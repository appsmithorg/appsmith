import type { AxiosPromise } from "axios";
import type {
  UpdateGlobalProfileRequestParams,
  UpdateGlobalProfileResponse,
} from "./updateGlobalProfileRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function updateGlobalProfileRequest(
  params: UpdateGlobalProfileRequestParams,
): AxiosPromise<UpdateGlobalProfileResponse> {
  return Api.post(`${GIT_BASE_URL}/profile/default`, params);
}

import type { AxiosPromise } from "axios";
import type {
  UpdateLocalProfileRequestParams,
  UpdateLocalProfileResponse,
} from "./updateLocalProfileRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function updateLocalProfileRequest(
  baseApplicationId: string,
  params: UpdateLocalProfileRequestParams,
): AxiosPromise<UpdateLocalProfileResponse> {
  return Api.put(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`, params);
}

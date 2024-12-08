import type { AxiosResponse } from "axios";
import type {
  UpdateLocalConfigRequestParams,
  UpdateLocalConfigResponse,
} from "./updateLocalConfigRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function updateLocalConfigRequest(
  baseApplicationId: string,
  params: UpdateLocalConfigRequestParams,
): Promise<AxiosResponse<UpdateLocalConfigResponse>> {
  return Api.put(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`, params);
}

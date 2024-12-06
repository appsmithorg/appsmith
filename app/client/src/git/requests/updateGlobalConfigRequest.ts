import type { AxiosResponse } from "axios";
import type {
  UpdateGlobalConfigRequestParams,
  UpdateGlobalConfigResponse,
} from "./updateGlobalConfigRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function updateGlobalConfigRequest(
  params: UpdateGlobalConfigRequestParams,
): Promise<AxiosResponse<UpdateGlobalConfigResponse>> {
  return Api.post(`${GIT_BASE_URL}/profile/default`, params);
}

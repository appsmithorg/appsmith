import Api from "api/Api";
import type { AxiosResponse } from "axios";
import type { FetchGlobalConfigResponse } from "./fetchGlobalConfigRequest.types";
import { GIT_BASE_URL } from "./constants";

export async function fetchLocalConfigRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchGlobalConfigResponse>> {
  return Api.get(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`);
}

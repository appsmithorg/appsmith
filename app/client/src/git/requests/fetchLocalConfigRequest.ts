import Api from "api/Api";
import type { AxiosResponse } from "axios";
import { GIT_BASE_URL } from "./constants";
import type { FetchLocalConfigResponse } from "./fetchLocalConfigRequest.types";

export async function fetchLocalConfigRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchLocalConfigResponse>> {
  return Api.get(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`);
}

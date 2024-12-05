import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { FetchGlobalConfigResponse } from "./fetchGlobalConfigRequest.types";

export async function fetchGlobalConfigRequest(): Promise<
  AxiosResponse<FetchGlobalConfigResponse>
> {
  return Api.get(`${GIT_BASE_URL}/profile/default`);
}

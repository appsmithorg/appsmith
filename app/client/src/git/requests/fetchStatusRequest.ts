import Api from "api/Api";
import type {
  FetchStatusRequestParams,
  FetchStatusResponse,
} from "./fetchStatusRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";

export default async function fetchStatusRequest(
  branchedApplicationId: string,
  params: FetchStatusRequestParams = { compareRemote: true },
): Promise<AxiosResponse<FetchStatusResponse>> {
  return Api.get(`${GIT_BASE_URL}/status/app/${branchedApplicationId}`, params);
}

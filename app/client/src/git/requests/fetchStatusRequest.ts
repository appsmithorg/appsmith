import Api from "api/Api";
import type {
  FetchStatusRequestParams,
  FetchStatusResponse,
} from "./fetchStatusRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";

export default async function fetchStatusRequest(
  branchedApplicationId: string,
  params: FetchStatusRequestParams = { compareRemote: true },
): AxiosPromise<FetchStatusResponse> {
  return Api.get(`${GIT_BASE_URL}/status/app/${branchedApplicationId}`, params);
}

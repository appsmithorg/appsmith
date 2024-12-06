import type { AxiosResponse } from "axios";
import type {
  FetchMergeStatusRequestParams,
  FetchMergeStatusResponse,
} from "./fetchMergeStatusRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";

export default async function fetchMergeStatusRequest(
  branchedApplicationId: string,
  params: FetchMergeStatusRequestParams,
): Promise<AxiosResponse<FetchMergeStatusResponse>> {
  return Api.post(
    `${GIT_BASE_URL}/merge/status/app/${branchedApplicationId}`,
    params,
  );
}

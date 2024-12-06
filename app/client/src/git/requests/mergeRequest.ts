import Api from "api/Api";
import type { MergeRequestParams, MergeResponse } from "./mergeRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";

export default async function mergeRequest(
  branchedApplicationId: string,
  params: MergeRequestParams,
): Promise<AxiosResponse<MergeResponse>> {
  return Api.post(`${GIT_BASE_URL}/merge/app/${branchedApplicationId}`, params);
}

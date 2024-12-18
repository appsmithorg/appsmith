import Api from "api/Api";
import type { MergeRequestParams, MergeResponse } from "./mergeRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";

export default async function mergeRequest(
  branchedApplicationId: string,
  params: MergeRequestParams,
): AxiosPromise<MergeResponse> {
  return Api.post(`${GIT_BASE_URL}/merge/app/${branchedApplicationId}`, params);
}

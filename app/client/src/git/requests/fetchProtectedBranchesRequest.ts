import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchProtectedBranchesResponse } from "./fetchProtectedBranchesRequest.types";

export default async function fetchProtectedBranchesRequest(
  baseApplicationId: string,
): AxiosPromise<FetchProtectedBranchesResponse> {
  return Api.get(`${GIT_BASE_URL}/branch/app/${baseApplicationId}/protected`);
}

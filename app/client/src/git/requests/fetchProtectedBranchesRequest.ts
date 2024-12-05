import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { FetchProtectedBranches } from "./fetchProtectedBranchesRequest.types";

export async function fetchProtectedBranchesRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchProtectedBranches>> {
  return Api.get(`${GIT_BASE_URL}/branch/app/${baseApplicationId}/protected`);
}

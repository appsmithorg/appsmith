import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  FetchBranchesRequestParams,
  FetchBranchesResponse,
} from "./fetchBranchesRequest.types";
import type { AxiosResponse } from "axios";

export async function fetchBranchesRequest(
  branchedApplicationId: string,
  params?: FetchBranchesRequestParams,
): Promise<AxiosResponse<FetchBranchesResponse>> {
  const queryParams = {} as FetchBranchesRequestParams;

  if (params?.pruneBranches) queryParams.pruneBranches = true;

  return Api.get(
    `${GIT_BASE_URL}/branch/app/${branchedApplicationId}`,
    queryParams,
  );
}

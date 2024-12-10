import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  FetchBranchesRequestParams,
  FetchBranchesResponse,
} from "./fetchBranchesRequest.types";
import type { AxiosPromise } from "axios";

export default async function fetchBranchesRequest(
  branchedApplicationId: string,
  params: FetchBranchesRequestParams = { pruneBranches: true },
): AxiosPromise<FetchBranchesResponse> {
  const queryParams = {} as FetchBranchesRequestParams;

  if (params.pruneBranches) queryParams.pruneBranches = true;

  return Api.get(
    `${GIT_BASE_URL}/branch/app/${branchedApplicationId}`,
    undefined,
    { params: queryParams },
  );
}

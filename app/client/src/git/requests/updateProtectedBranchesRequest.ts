import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  UpdateProtectedBranchesRequestParams,
  UpdateProtectedBranchesResponse,
} from "./updateProtectedBranchesRequest.types";
import type { AxiosResponse } from "axios";

export async function updateProtectedBranchesRequest(
  baseApplicationId: string,
  params: UpdateProtectedBranchesRequestParams,
): Promise<AxiosResponse<UpdateProtectedBranchesResponse>> {
  return Api.post(
    `${GIT_BASE_URL}/branch/app/${baseApplicationId}/protected`,
    params,
  );
}

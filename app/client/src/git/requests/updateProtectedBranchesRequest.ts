import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  UpdateProtectedBranchesRequestParams,
  UpdateProtectedBranchesResponse,
} from "./updateProtectedBranchesRequest.types";
import type { AxiosPromise } from "axios";

export default async function updateProtectedBranchesRequest(
  baseApplicationId: string,
  params: UpdateProtectedBranchesRequestParams,
): AxiosPromise<UpdateProtectedBranchesResponse> {
  return Api.post(
    `${GIT_BASE_URL}/branch/app/${baseApplicationId}/protected`,
    params,
  );
}

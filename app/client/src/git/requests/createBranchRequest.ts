import type { AxiosResponse } from "axios";
import type {
  CreateBranchRequestParams,
  CreateBranchResponse,
} from "./createBranchRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export default async function createBranchRequest(
  branchedApplicationId: string,
  params: CreateBranchRequestParams,
): Promise<AxiosResponse<CreateBranchResponse>> {
  return Api.post(
    `${GIT_BASE_URL}/create-branch/app/${branchedApplicationId}`,
    params,
  );
}

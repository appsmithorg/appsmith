import type { AxiosPromise } from "axios";
import type {
  CreateBranchRequestParams,
  CreateBranchResponse,
} from "./createBranchRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export default async function createBranchRequestOld(
  branchedApplicationId: string,
  params: CreateBranchRequestParams,
): AxiosPromise<CreateBranchResponse> {
  return Api.post(
    `${GIT_BASE_URL}/create-branch/app/${branchedApplicationId}`,
    params,
  );
}

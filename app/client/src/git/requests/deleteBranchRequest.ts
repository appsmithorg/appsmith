import type { AxiosPromise } from "axios";
import type {
  DeleteBranchRequestParams,
  DeleteBranchResponse,
} from "./deleteBranchRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export default async function deleteBranchRequestOld(
  baseApplicationId: string,
  params: DeleteBranchRequestParams,
): AxiosPromise<DeleteBranchResponse> {
  return Api.delete(`${GIT_BASE_URL}/branch/app/${baseApplicationId}`, params);
}

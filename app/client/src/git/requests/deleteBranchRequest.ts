import type { AxiosResponse } from "axios";
import type {
  DeleteBranchRequestParams,
  DeleteBranchResponse,
} from "./deleteBranchRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export async function deleteBranchRequest(
  baseApplicationId: string,
  params: DeleteBranchRequestParams,
): Promise<AxiosResponse<DeleteBranchResponse>> {
  return Api.delete(`${GIT_BASE_URL}/branch/app/${baseApplicationId}`, params);
}

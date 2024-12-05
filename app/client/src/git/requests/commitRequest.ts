import Api from "api/Api";
import type {
  CommitRequestParams,
  CommitResponse,
} from "./commitRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";

export async function commitRequest(
  branchedApplicationId: string,
  params: CommitRequestParams,
): Promise<AxiosResponse<CommitResponse>> {
  return Api.post(
    `${GIT_BASE_URL}/commit/app/${branchedApplicationId}`,
    params,
  );
}

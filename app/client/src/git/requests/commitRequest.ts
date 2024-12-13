import Api from "api/Api";
import type {
  CommitRequestParams,
  CommitResponse,
} from "./commitRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";

export default async function commitRequest(
  branchedApplicationId: string,
  params: CommitRequestParams,
): AxiosPromise<CommitResponse> {
  return Api.post(
    `${GIT_BASE_URL}/commit/app/${branchedApplicationId}`,
    params,
  );
}

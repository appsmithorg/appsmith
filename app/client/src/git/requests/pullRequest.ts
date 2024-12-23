import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { PullResponse } from "./pullRequest.types";

export default async function pullRequest(
  branchedApplicationId: string,
): AxiosPromise<PullResponse> {
  return Api.get(`${GIT_BASE_URL}/pull/app/${branchedApplicationId}`);
}

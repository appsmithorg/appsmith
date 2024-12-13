import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { PullRequestResponse } from "./pullRequest.types";

export default async function pullRequest(
  branchedApplicationId: string,
): AxiosPromise<PullRequestResponse> {
  return Api.get(`${GIT_BASE_URL}/pull/app/${branchedApplicationId}`);
}

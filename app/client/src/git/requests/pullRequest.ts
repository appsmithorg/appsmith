import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { PullRequestResponse } from "./pullRequest.types";

export default async function pullRequest(
  branchedApplicationId: string,
): Promise<AxiosResponse<PullRequestResponse>> {
  return Api.get(`${GIT_BASE_URL}/pull/app/${branchedApplicationId}`);
}

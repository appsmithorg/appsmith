import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { DiscardResponse } from "./discardRequest.types";

export default async function discardRequest(
  branchedApplicationId: string,
): AxiosPromise<DiscardResponse> {
  return Api.put(`${GIT_BASE_URL}/discard/app/${branchedApplicationId}`);
}

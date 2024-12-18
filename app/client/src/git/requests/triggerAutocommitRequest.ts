import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { TriggerAutocommitResponse } from "./triggerAutocommitRequest.types";

export default async function triggerAutocommitRequest(
  branchedApplicationId: string,
): AxiosPromise<TriggerAutocommitResponse> {
  return Api.post(`${GIT_BASE_URL}/auto-commit/app/${branchedApplicationId}`);
}

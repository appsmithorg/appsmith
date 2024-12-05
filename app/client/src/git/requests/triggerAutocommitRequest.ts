import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { TriggerAutocommitResponse } from "./triggerAutocommitRequest.types";

export async function triggerAutocommitRequest(
  branchedApplicationId: string,
): Promise<AxiosResponse<TriggerAutocommitResponse>> {
  return Api.post(`${GIT_BASE_URL}/auto-commit/app/${branchedApplicationId}`);
}

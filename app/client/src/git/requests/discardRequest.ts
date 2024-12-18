import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";

export default async function discardRequest(
  branchedApplicationId: string,
): AxiosPromise<void> {
  return Api.put(`${GIT_BASE_URL}/discard/app/${branchedApplicationId}`);
}

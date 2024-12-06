import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";

export default async function discardRequest(
  branchedApplicationId: string,
): Promise<AxiosResponse<void>> {
  return Api.put(`${GIT_BASE_URL}/discard/app/${branchedApplicationId}`);
}

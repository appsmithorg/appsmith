import type { AxiosResponse } from "axios";
import { GIT_BASE_URL } from "./constants";
import type { DisconnectResponse } from "./disconnectRequest.types";
import Api from "api/Api";

export async function disconnectRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<DisconnectResponse>> {
  return Api.post(`${GIT_BASE_URL}/disconnect/app/${baseApplicationId}`);
}

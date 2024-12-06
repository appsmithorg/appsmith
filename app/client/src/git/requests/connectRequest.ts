import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  ConnectRequestParams,
  ConnectResponse,
} from "./connectRequest.types";
import type { AxiosResponse } from "axios";

export default async function connectRequest(
  baseApplicationId: string,
  params: ConnectRequestParams,
): Promise<AxiosResponse<ConnectResponse>> {
  return Api.post(`${GIT_BASE_URL}/connect/app/${baseApplicationId}`, params);
}

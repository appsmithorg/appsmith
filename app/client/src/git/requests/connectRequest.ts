import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  ConnectRequestParams,
  ConnectResponse,
} from "./connectRequest.types";
import type { AxiosPromise } from "axios";

export default async function connectRequest(
  baseApplicationId: string,
  params: ConnectRequestParams,
): AxiosPromise<ConnectResponse> {
  return Api.post(`${GIT_BASE_URL}/connect/app/${baseApplicationId}`, params);
}

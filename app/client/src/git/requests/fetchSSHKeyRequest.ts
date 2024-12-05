import type { AxiosResponse } from "axios";
import type { FetchSSHKeyResponse } from "./fetchSSHKeyRequest.types";
import Api from "api/Api";
import { APPLICATION_BASE_URL } from "./constants";

export async function fetchSSHKeyRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchSSHKeyResponse>> {
  return Api.get(`${APPLICATION_BASE_URL}/ssh-keypair/${baseApplicationId}`);
}

import type { AxiosResponse } from "axios";
import type { FetchSSHKeyResponse } from "./fetchSSHKeyRequest.types";
import Api from "api/Api";

export async function fetchSSHKeyRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchSSHKeyResponse>> {
  return Api.get("v1/applications/ssh-keypair/" + baseApplicationId);
}

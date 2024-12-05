import type { AxiosResponse } from "axios";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "./generateSSHKeyRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export async function generateSSHKeyRequest(
  baseApplicationId: string,
  params: GenerateSSHKeyRequestParams,
): Promise<AxiosResponse<GenerateSSHKeyResponse>> {
  const url = params.isImporting
    ? `${GIT_BASE_URL}/import/keys?keyType=${params.keyType}`
    : `v1/applications/ssh-keypair/${baseApplicationId}?keyType=${params.keyType}`;

  return params.isImporting ? Api.get(url) : Api.post(url);
}

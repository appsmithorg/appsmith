import type { AxiosPromise } from "axios";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "./generateSSHKeyRequest.types";
import { APPLICATION_BASE_URL, GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export default async function generateSSHKeyRequest(
  baseApplicationId: string,
  params: GenerateSSHKeyRequestParams,
): AxiosPromise<GenerateSSHKeyResponse> {
  const url = params.isImporting
    ? `${GIT_BASE_URL}/import/keys?keyType=${params.keyType}`
    : `${APPLICATION_BASE_URL}/ssh-keypair/${baseApplicationId}?keyType=${params.keyType}`;

  return params.isImporting ? Api.get(url) : Api.post(url);
}

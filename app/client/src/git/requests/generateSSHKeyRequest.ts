import type { AxiosPromise } from "axios";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "./generateSSHKeyRequest.types";
import { APPLICATION_BASE_URL } from "./constants";
import Api from "api/Api";

export default async function generateSSHKeyRequest(
  baseApplicationId: string,
  params: GenerateSSHKeyRequestParams,
): AxiosPromise<GenerateSSHKeyResponse> {
  const url = `${APPLICATION_BASE_URL}/ssh-keypair/${baseApplicationId}?keyType=${params.keyType}`;

  return Api.post(url);
}

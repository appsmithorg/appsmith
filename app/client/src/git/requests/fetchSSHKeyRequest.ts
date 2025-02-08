import type { AxiosPromise } from "axios";
import type { FetchSSHKeyResponse } from "./fetchSSHKeyRequest.types";
import Api from "api/Api";
import { APPLICATION_BASE_URL } from "./constants";

export default async function fetchSSHKeyRequest(
  baseArtifactId: string,
): AxiosPromise<FetchSSHKeyResponse> {
  return Api.get(`${APPLICATION_BASE_URL}/ssh-keypair/${baseArtifactId}`);
}

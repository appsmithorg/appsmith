import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type {
  FetchGlobalSSHKeyRequestParams,
  FetchGlobalSSHKeyResponse,
} from "./fetchGlobalSSHKeyRequest.types";

export default async function fetchGlobalSSHKeyRequest(
  params: FetchGlobalSSHKeyRequestParams,
): AxiosPromise<FetchGlobalSSHKeyResponse> {
  const url = `${GIT_BASE_URL}/import/keys?keyType=${params.keyType}`;

  return Api.get(url);
}

import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type {
  FetchGlobalSSHKeyRequestParams,
  FetchGlobalSSHKeyResponse,
} from "./fetchGlobalSSHKeyRequest.types";

async function fetchGlobalSSHKeyRequestOld(
  params: FetchGlobalSSHKeyRequestParams,
): AxiosPromise<FetchGlobalSSHKeyResponse> {
  const url = `${GIT_BASE_URL}/import/keys?keyType=${params.keyType}`;

  return Api.get(url);
}

async function fetchGlobalSSHKeyRequestNew(
  params: FetchGlobalSSHKeyRequestParams,
): AxiosPromise<FetchGlobalSSHKeyResponse> {
  const url = `${GIT_BASE_URL}/artifacts/import/keys?keyType=${params.keyType}`;

  return Api.get(url);
}

export default async function fetchGlobalSSHKeyRequest(
  params: FetchGlobalSSHKeyRequestParams,
  isNew: boolean,
): AxiosPromise<FetchGlobalSSHKeyResponse> {
  if (isNew) {
    return fetchGlobalSSHKeyRequestNew(params);
  } else {
    return fetchGlobalSSHKeyRequestOld(params);
  }
}

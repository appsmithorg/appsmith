import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  GitImportRequestParams,
  GitImportResponse,
} from "./gitImportRequest.types";
import type { AxiosPromise } from "axios";

async function gitImportRequestOld(
  workspaceId: string,
  params: GitImportRequestParams,
): AxiosPromise<GitImportResponse> {
  return Api.post(`${GIT_BASE_URL}/import/${workspaceId}`, params);
}

async function gitImportRequestNew(
  workspaceId: string,
  params: GitImportRequestParams,
): AxiosPromise<GitImportResponse> {
  return Api.post(`${GIT_BASE_URL}/artifacts/import`, params, {workspaceId,
  });
}

export default async function gitImportRequest(
  workspaceId: string,
  params: GitImportRequestParams,
  isNew: boolean,
): AxiosPromise<GitImportResponse> {
  if (isNew) {
    return gitImportRequestNew(workspaceId, params);
  } else {
    return gitImportRequestOld(workspaceId, params);
  }
}

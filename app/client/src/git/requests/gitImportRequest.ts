import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  GitImportRequestParams,
  GitImportResponse,
} from "./gitImportRequest.types";
import type { AxiosPromise } from "axios";

export default async function gitImportRequest(
  workspaceId: string,
  params: GitImportRequestParams,
): AxiosPromise<GitImportResponse> {
  return Api.post(`${GIT_BASE_URL}/import/${workspaceId}`, params);
}

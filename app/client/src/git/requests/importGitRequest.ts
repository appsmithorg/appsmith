import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  ImportGitRequestParams,
  ImportGitResponse,
} from "./importGitRequest.types";
import type { AxiosPromise } from "axios";

export default async function importGitRequest(
  workspaceId: string,
  params: ImportGitRequestParams,
): AxiosPromise<ImportGitResponse> {
  return Api.post(`${GIT_BASE_URL}/import/${workspaceId}`, params);
}

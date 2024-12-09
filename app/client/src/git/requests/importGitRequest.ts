import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  ImportGitRequestParams,
  ImportGitResponse,
} from "./importGitRequest.types";
import type { AxiosResponse } from "axios";

export default async function importGitRequest(
  workspaceId: string,
  params: ImportGitRequestParams,
): Promise<AxiosResponse<ImportGitResponse>> {
  return Api.post(`${GIT_BASE_URL}/import/${workspaceId}`, params);
}

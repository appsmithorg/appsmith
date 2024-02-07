import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";

export interface CurlImportRequest {
  type: string;
  contextId: string;
  name: string;
  curl: string;
  workspaceId: string;
  contextType: string;
}

class CurlImportApi extends Api {
  static curlImportURL = `v1/import`;

  static async curlImport(
    request: CurlImportRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { contextId, contextType, curl, name, workspaceId } = request;
    return Api.post(CurlImportApi.curlImportURL, curl, {
      type: "CURL",
      contextId,
      name,
      workspaceId,
      contextType,
    });
  }
}

export default CurlImportApi;

import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";

export interface CurlImportRequest {
  type: string;
  pageId: string;
  name: string;
  curl: string;
  workspaceId: string;
}

class CurlImportApi extends Api {
  static curlImportURL = `v1/import`;

  static curlImport(request: CurlImportRequest): AxiosPromise<ApiResponse> {
    const { curl, name, pageId, workspaceId } = request;
    return Api.post(CurlImportApi.curlImportURL, curl, {
      type: "CURL",
      pageId,
      name,
      workspaceId,
    });
  }
}

export default CurlImportApi;

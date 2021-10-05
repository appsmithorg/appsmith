import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";

export interface CurlImportRequest {
  type: string;
  pageId: string;
  name: string;
  curl: string;
  organizationId: string;
}

class CurlImportApi extends Api {
  static curlImportURL = `v1/import`;

  static curlImport(request: CurlImportRequest): AxiosPromise<ApiResponse> {
    const { curl, name, organizationId, pageId } = request;
    return Api.post(CurlImportApi.curlImportURL, curl, {
      type: "CURL",
      pageId,
      name,
      organizationId,
    });
  }
}

export default CurlImportApi;

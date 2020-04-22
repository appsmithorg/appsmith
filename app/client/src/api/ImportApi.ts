import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

export interface CurlImportRequest {
  type: string;
  pageId: string;
  name: string;
  curl: string;
}

class CurlImportApi extends Api {
  static curlImportURL = `v1/import`;

  static curlImport(request: CurlImportRequest): AxiosPromise<ApiResponse> {
    const { pageId, name, curl } = request;
    return Api.post(CurlImportApi.curlImportURL, curl, {
      type: "CURL",
      pageId,
      name,
    });
  }
}

export default CurlImportApi;

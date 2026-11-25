import Api from "api/Api";
import type { ApiResponse } from "api/types";
import type {
  SectionId,
  SectionResult,
  SectionsResponse,
} from "../pages/AdminSettings/SupportDiagnostics/types";

/**
 * The Api client resolves with the `ResponseDTO` body. Error responses with a
 * `responseMeta` also resolve; check `responseMeta.success` before reading
 * `data`.
 */
type ApiResult<T> = Promise<ApiResponse<T>>;

async function asApiResult<T>(request: Promise<unknown>): ApiResult<T> {
  return (await request) as ApiResponse<T>;
}

export interface RecordDownloadRequest {
  sectionIds: SectionId[];
  encrypted: boolean;
}

class SupportDiagnosticsApi extends Api {
  static baseUrl = "v1/admin/support/diagnostics";

  static async listSections(): ApiResult<SectionsResponse> {
    return asApiResult(Api.get(`${SupportDiagnosticsApi.baseUrl}/sections`));
  }

  static async collectSection(id: SectionId): ApiResult<SectionResult> {
    return asApiResult(
      Api.post(`${SupportDiagnosticsApi.baseUrl}/sections/${id}/collect`),
    );
  }

  static async recordDownload(body: RecordDownloadRequest): ApiResult<null> {
    return asApiResult(
      Api.post(`${SupportDiagnosticsApi.baseUrl}/downloads`, body),
    );
  }
}

export default SupportDiagnosticsApi;

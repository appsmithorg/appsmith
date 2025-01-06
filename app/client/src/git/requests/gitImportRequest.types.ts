import type { ApiResponse } from "api/types";
import type { ApplicationResponsePayload } from "ee/api/ApplicationApi";
import type { Datasource } from "entities/Datasource";

export interface GitImportRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

export interface GitImportResponseData {
  application: ApplicationResponsePayload;
  isPartialImport: boolean;
  unconfiguredDatasourceList?: Datasource[];
}

export type GitImportResponse = ApiResponse<GitImportResponseData>;

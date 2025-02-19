import type { ApiResponse } from "api/types";
import type { Datasource } from "entities/Datasource";
import type { GitApplicationArtifact, GitPackageArtifact } from "git/types";

export interface GitImportRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

export interface GitImportResponseData {
  application?: GitApplicationArtifact;
  package?: GitPackageArtifact;
  isPartialImport: boolean;
  unConfiguredDatasourceList?: Datasource[];
}

export type GitImportResponse = ApiResponse<GitImportResponseData>;

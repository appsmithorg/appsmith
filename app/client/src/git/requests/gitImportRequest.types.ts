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
  override?: boolean;
  /**
   * Optional ID of an existing SSH key to use for this import.
   * If provided, the server will use this key instead of generating a new one.
   * The key must be owned by or shared with the current user.
   */
  sshKeyId?: string;
}

export interface GitImportResponseData {
  application?: GitApplicationArtifact;
  package?: GitPackageArtifact;
  isPartialImport: boolean;
  unConfiguredDatasourceList?: Datasource[];
}

export type GitImportResponse = ApiResponse<GitImportResponseData>;

import type { ApiResponse } from "api/ApiResponses";
import type { FetchApplicationsResponse } from "@appsmith/api/ApplicationApi";
import type { FetchWorkspacesResponse } from "@appsmith/api/WorkspaceApi";

export interface SearchApiResponse extends ApiResponse {
  data: {
    applications: FetchApplicationsResponse[];
    workspaces: FetchWorkspacesResponse[];
  };
}

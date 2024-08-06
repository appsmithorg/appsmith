import type { ApiResponse } from "api/ApiResponses";
import type { FetchApplicationsResponse } from "ee/api/ApplicationApi";
import type { FetchWorkspacesResponse } from "ee/api/WorkspaceApi";

export interface SearchApiResponse extends ApiResponse {
  data: {
    applications: FetchApplicationsResponse[];
    workspaces: FetchWorkspacesResponse[];
  };
}

import type { ApiResponse } from "api/types";

export interface UpdateProtectedBranchesRequestParams {
  branchNames: string[];
}

export type UpdateProtectedBranchesResponseData = string[];

export type UpdateProtectedBranchesResponse =
  ApiResponse<UpdateProtectedBranchesResponseData>;

import type { ApiResponse } from "api/ApiResponses";

export interface FetchBranchesRequestParams {
  pruneBranches: boolean;
}

interface SingleBranch {
  branchName: string;
  createdFromLocal: string;
  default: boolean;
}

export type FetchBranchesResponseData = SingleBranch[];

export type FetchBranchesResponse = ApiResponse<FetchBranchesResponseData>;

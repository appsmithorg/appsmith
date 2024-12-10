import type { ApiResponse } from "api/types";

export type FetchProtectedBranchesResponseData = string[];

export type FetchProtectedBranchesResponse =
  ApiResponse<FetchProtectedBranchesResponseData>;

import type { ApiResponse } from "api/types";

export interface DeleteBranchRequestParams {
  branchName: string;
}

export interface DeleteBranchResponseData {
  id: string; // applicationId
  baseId: string; // baseApplicationId
}

export type DeleteBranchResponse = ApiResponse<DeleteBranchResponseData>;

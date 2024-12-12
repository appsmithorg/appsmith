import type { ApiResponse } from "api/types";

export interface CreateBranchRequestParams {
  branchName: string;
}

export interface CreateBranchResponseData {
  id: string; // applicationId
  baseId: string; // baseApplicationId
}

export type CreateBranchResponse = ApiResponse<CreateBranchResponseData>;

export interface CreateBranchRequestParams {
  branchName: string;
}

export interface CreateBranchResponse {
  id: string; // applicationId
  baseId: string; // baseApplicationId
}

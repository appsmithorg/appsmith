export interface DeleteBranchRequestParams {
  branchName: string;
}

export interface DeleteBranchResponse {
  id: string; // applicationId
  baseId: string; // baseApplicationId
}
